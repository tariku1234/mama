"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Piece, PieceColor } from "@/components/game-board"
import { executeMove, getValidMoves, GameType, initializeBoard, hasPlayerLost } from "@/lib/game-logic"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface GameData {
  id: string
  player1_id: string
  player2_id: string | null
  status: string
  current_turn: PieceColor
  board_state: { pieces: Piece[]; currentTurn: PieceColor }
  player1_time: number
  player2_time: number
  winner_id: string | null
  game_type: GameType
}

export function useMultiplayerGame(gameId: string, userId: string) {
  const [game, setGame] = useState<GameData | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [currentTurn, setCurrentTurn] = useState<PieceColor>("light")
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [playerColor, setPlayerColor] = useState<PieceColor>("light")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)

  const supabase = createClient()
  const gameType = game?.game_type ?? "soldier"

  useEffect(() => {
    async function loadGame() {
      try {
        const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()
        if (error) throw error
        if (!data) throw new Error("Game not found")

        const gameData = data as GameData
        setGame(gameData)
        const color = gameData.player1_id === userId ? "light" : "dark"
        setPlayerColor(color)

        if (!gameData.board_state || gameData.board_state.pieces.length === 0) {
          const initialPieces = initializeBoard(gameData.game_type)
          setPieces(initialPieces)
          setCurrentTurn("light")
          await supabase.from("games").update({ board_state: { pieces: initialPieces, currentTurn: "light" } }).eq("id", gameId)
        } else {
          const gameState = gameData.board_state
          setPieces(gameState.pieces)
          setCurrentTurn(gameState.currentTurn)
        }
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load game")
        setIsLoading(false)
      }
    }
    loadGame()
  }, [gameId, userId, supabase])

  useEffect(() => {
    if (isLoading) return
    const channel = supabase.channel(`game:${gameId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` }, (payload) => {
      const updatedGame = payload.new as GameData
      setGame(updatedGame)
      const gameState = updatedGame.board_state
      setPieces(gameState.pieces)
      setCurrentTurn(gameState.currentTurn)
      if (updatedGame.current_turn !== playerColor) {
        setSelectedPiece(null)
        setValidMoves([])
      }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [gameId, isLoading, supabase, playerColor])

  const makeMove = useCallback(async (piece: Piece, newPosition: { row: number; col: number }) => {
    if (!game || game.status !== "active" || !piece) return

    const updatedPieces = executeMove(pieces, piece.id, newPosition, gameType)
    const opponentColor = currentTurn === "light" ? "dark" : "light"

    if (hasPlayerLost(updatedPieces, opponentColor, gameType)) {
      const winnerId = userId;
      await supabase.rpc("end_game", { game_id_param: gameId, winner_id_param: winnerId, is_draw: false });
      return;
    }

    const movedPiece = updatedPieces.find((p) => p.id === piece.id)
    let nextTurn = currentTurn === "light" ? "dark" : "light"
    let isMultiJump = false

    if (movedPiece && Math.abs(newPosition.row - piece.position.row) > 1) {
      const additionalCaptures = getValidMoves(movedPiece, updatedPieces, gameType)
      if (additionalCaptures.length > 0) {
        const firstCapture = additionalCaptures[0]
        const rowDiff = Math.abs(firstCapture.row - movedPiece.position.row)
        if (rowDiff > 1) {
          isMultiJump = true
          nextTurn = currentTurn
        }
      }
    }

    try {
      const { error } = await supabase.from("games").update({ board_state: { pieces: updatedPieces, currentTurn: nextTurn }, current_turn: nextTurn }).eq("id", gameId)
      if (error) throw error

      if (isMultiJump) {
        const movedPieceAgain = updatedPieces.find((p) => p.id === piece.id)
        if (movedPieceAgain) {
          setSelectedPiece(movedPieceAgain)
          setValidMoves(getValidMoves(movedPieceAgain, updatedPieces, gameType))
        }
      } else {
        setSelectedPiece(null)
        setValidMoves([])
      }
    } catch (err) {
      setError("Failed to make move")
    }
  }, [game, pieces, currentTurn, gameId, supabase, gameType, userId])

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!game || game.status !== "active" || playerColor !== currentTurn) return
    const pieceAtSquare = pieces.find((p) => p.position.row === row && p.position.col === col)
    if (selectedPiece) {
      const isValidMove = validMoves.some((move) => move.row === row && move.col === col)
      if (isValidMove) {
        makeMove(selectedPiece, { row, col })
      } else if (pieceAtSquare && pieceAtSquare.color === playerColor) {
        setSelectedPiece(pieceAtSquare)
        setValidMoves(getValidMoves(pieceAtSquare, pieces, gameType))
      } else {
        setSelectedPiece(null)
        setValidMoves([])
      }
    } else if (pieceAtSquare && pieceAtSquare.color === playerColor) {
      setSelectedPiece(pieceAtSquare)
      setValidMoves(getValidMoves(pieceAtSquare, pieces, gameType))
    }
  }, [game, playerColor, currentTurn, pieces, selectedPiece, validMoves, makeMove, gameType])

  const resignGame = useCallback(async () => {
    if (!game) return;
    const winnerId = game.player1_id === userId ? game.player2_id : game.player1_id;
    try {
      const { error } = await supabase.rpc("end_game", { game_id_param: gameId, winner_id_param: winnerId, is_draw: false });
      if (error) throw error;
    } catch (err) {
      setError("Failed to resign game");
    }
  }, [game, gameId, userId, supabase]);

  const offerDraw = useCallback(async () => {
    if (!game) return;
    try {
      const { error } = await supabase.rpc("end_game", { game_id_param: gameId, winner_id_param: null, is_draw: true });
      if (error) throw error;
    } catch (err) {
      setError("Failed to offer draw");
    }
  }, [game, gameId, supabase]);

  return { game, pieces, currentTurn, validMoves, playerColor, isLoading, error, selectedPiece, handleSquareClick, resignGame, offerDraw }
}
