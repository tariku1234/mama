"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Piece, PieceColor } from "@/components/game-board"
import { executeMove, getValidMoves } from "@/lib/game-logic"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface GameData {
  id: string
  player1_id: string
  player2_id: string | null
  status: string
  current_turn: string
  board_state: { pieces: Piece[]; currentTurn: PieceColor }
  player1_time: number
  player2_time: number
  winner_id: string | null
}

export function useMultiplayerGame(gameId: string, userId: string) {
  const [game, setGame] = useState<GameData | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [currentTurn, setCurrentTurn] = useState<PieceColor>("light")
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [playerColor, setPlayerColor] = useState<PieceColor>("light")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Load initial game state
  useEffect(() => {
    async function loadGame() {
      try {
        const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()

        if (error) throw error
        if (!data) throw new Error("Game not found")

        setGame(data)

        // Determine player color
        const color = data.player1_id === userId ? "light" : "dark"
        setPlayerColor(color)

        // Load board state
        const gameState = data.board_state as { pieces: Piece[]; currentTurn: PieceColor }
        setPieces(gameState.pieces)
        setCurrentTurn(gameState.currentTurn)

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load game")
        setIsLoading(false)
      }
    }

    loadGame()
  }, [gameId, userId, supabase])

  // Subscribe to real-time updates
  useEffect(() => {
    let channel: RealtimeChannel

    async function setupRealtimeSubscription() {
      channel = supabase
        .channel(`game:${gameId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "games",
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            const updatedGame = payload.new as GameData

            setGame(updatedGame)

            // Update board state
            const gameState = updatedGame.board_state as { pieces: Piece[]; currentTurn: PieceColor }
            setPieces(gameState.pieces)
            setCurrentTurn(gameState.currentTurn)
          },
        )
        .subscribe()
    }

    if (gameId && !isLoading) {
      setupRealtimeSubscription()
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [gameId, isLoading, supabase])

  const makeMove = useCallback(
    async (pieceId: string, newPosition: { row: number; col: number }) => {
      if (!game || game.status !== "active") return false

      // Check if it's the player's turn
      const isPlayerTurn =
        (playerColor === "light" && currentTurn === "light") || (playerColor === "dark" && currentTurn === "dark")

      if (!isPlayerTurn) return false

      // Validate move
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece) return false

      const moves = getValidMoves(piece, pieces)
      const isValidMove = moves.some((m) => m.row === newPosition.row && m.col === newPosition.col)

      if (!isValidMove) return false

      // Execute move locally first for immediate feedback
      const updatedPieces = executeMove(pieces, pieceId, newPosition)

      // Check if multi-jump is possible
      const rowDiff = Math.abs(newPosition.row - piece.position.row)
      let nextTurn = currentTurn === "light" ? "dark" : "light"

      if (rowDiff === 2) {
        const movedPiece = updatedPieces.find((p) => p.id === pieceId)
        if (movedPiece) {
          const additionalCaptures = getValidMoves(movedPiece, updatedPieces).filter((move) => {
            const rowDiff = Math.abs(move.row - movedPiece.position.row)
            return rowDiff === 2
          })

          if (additionalCaptures.length > 0) {
            // Keep same turn for multi-jump
            nextTurn = currentTurn
            setValidMoves(additionalCaptures)
          } else {
            setValidMoves([])
          }
        }
      } else {
        setValidMoves([])
      }

      // Update database
      try {
        const newBoardState = { pieces: updatedPieces, currentTurn: nextTurn }

        const { error } = await supabase
          .from("games")
          .update({
            board_state: newBoardState,
            current_turn: nextTurn === "light" ? "player1" : "player2",
            last_move_at: new Date().toISOString(),
          })
          .eq("id", gameId)

        if (error) throw error

        // Also insert move into game_moves table
        await supabase.from("game_moves").insert({
          game_id: gameId,
          player_id: userId,
          move_data: { from: piece.position, to: newPosition },
          move_number: game.board_state.pieces.length,
        })

        return true
      } catch (err) {
        console.error("[v0] Failed to update game:", err)
        setError("Failed to make move")
        return false
      }
    },
    [game, pieces, currentTurn, playerColor, gameId, userId, supabase],
  )

  const resignGame = useCallback(async () => {
    if (!game) return

    const winnerId = game.player1_id === userId ? game.player2_id : game.player1_id

    try {
      const { error } = await supabase.rpc("end_game", {
        game_id_param: gameId,
        winner_id_param: winnerId,
        is_draw: false,
      })

      if (error) throw error
    } catch (err) {
      console.error("[v0] Failed to resign:", err)
      setError("Failed to resign game")
    }
  }, [game, gameId, userId, supabase])

  const offerDraw = useCallback(async () => {
    // In a full implementation, this would send a draw offer to the opponent
    // For now, we'll just end the game as a draw
    try {
      const { error } = await supabase.rpc("end_game", {
        game_id_param: gameId,
        winner_id_param: null,
        is_draw: true,
      })

      if (error) throw error
    } catch (err) {
      console.error("[v0] Failed to offer draw:", err)
      setError("Failed to offer draw")
    }
  }, [gameId, supabase])

  return {
    game,
    pieces,
    currentTurn,
    validMoves,
    playerColor,
    isLoading,
    error,
    makeMove,
    resignGame,
    offerDraw,
    setValidMoves,
  }
}
