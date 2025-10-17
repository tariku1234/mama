"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Piece, PieceColor } from "@/components/game-board"
import { executeMove, getValidMoves } from "@/lib/game-logic"
import type { RealtimeChannel } from "@supabase/supabase-js"

// (Keep the GameData interface as is)
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
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null) // New state for selected piece

  const supabase = createClient()

  // (Keep the initial game loading useEffect as is)
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

  // (Keep the real-time subscription useEffect as is)
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

            // Update board state from real-time event
            const gameState = updatedGame.board_state as { pieces: Piece[]; currentTurn: PieceColor }
            setPieces(gameState.pieces)
            setCurrentTurn(gameState.currentTurn)

            // If a multi-jump is in progress, recalculate valid moves for the same piece
            const prevGameState = game?.board_state
            if (
              prevGameState &&
              gameState.currentTurn === prevGameState.currentTurn &&
              updatedGame.last_move_at !== game?.last_move_at
            ) {
              const movedPieceId = pieces.find(
                (p, i) =>
                  p.position.row !== prevGameState.pieces[i]?.position.row ||
                  p.position.col !== prevGameState.pieces[i]?.position.col,
              )?.id

              if (movedPieceId) {
                const movedPiece = pieces.find((p) => p.id === movedPieceId)
                if (movedPiece) {
                  const additionalCaptures = getValidMoves(movedPiece, pieces).filter((move) => {
                    const rowDiff = Math.abs(move.row - movedPiece.position.row)
                    return rowDiff === 2
                  })
                  if (additionalCaptures.length > 0) {
                    setSelectedPiece(movedPiece)
                    setValidMoves(additionalCaptures)
                  } else {
                    setSelectedPiece(null)
                    setValidMoves([])
                  }
                }
              }
            } else {
              // Clear selection on opponent's turn
              setSelectedPiece(null)
              setValidMoves([])
            }
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
  }, [gameId, isLoading, supabase, game, pieces])

  const makeMove = useCallback(
    async (piece: Piece, newPosition: { row: number; col: number }) => {
      if (!game || game.status !== "active" || !piece) return

      // Execute move locally first for immediate feedback
      const updatedPieces = executeMove(pieces, piece.id, newPosition)

      // Check for multi-jump opportunities
      const rowDiff = Math.abs(newPosition.row - piece.position.row)
      let nextTurn = currentTurn === "light" ? "dark" : "light"
      let additionalCaptures: { row: number; col: number }[] = []

      if (rowDiff === 2) {
        const movedPiece = updatedPieces.find((p) => p.id === piece.id)
        if (movedPiece) {
          additionalCaptures = getValidMoves(movedPiece, updatedPieces).filter((move) => {
            const innerRowDiff = Math.abs(move.row - movedPiece.position.row)
            return innerRowDiff === 2
          })

          if (additionalCaptures.length > 0) {
            nextTurn = currentTurn // Keep the turn for the current player
          }
        }
      }

      // Update the database
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
      } catch (err) {
        console.error("[v0] Failed to update game:", err)
        setError("Failed to make move")
        // Optionally revert local state here
      } finally {
        // Clear selection regardless of success/failure, the real-time subscription will update the state
        setSelectedPiece(null)
        setValidMoves([])
      }
    },
    [game, pieces, currentTurn, gameId, supabase],
  )

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!game || game.status !== "active") return

      const isPlayerTurn = playerColor === currentTurn
      if (!isPlayerTurn) return

      const pieceAtSquare = pieces.find((p) => p.position.row === row && p.position.col === col)

      if (selectedPiece) {
        const isValidMove = validMoves.some((move) => move.row === row && move.col === col)

        if (isValidMove) {
          makeMove(selectedPiece, { row, col })
        } else if (pieceAtSquare && pieceAtSquare.color === playerColor) {
          // Select another piece of the same color
          const newValidMoves = getValidMoves(pieceAtSquare, pieces)
          setSelectedPiece(pieceAtSquare)
          setValidMoves(newValidMoves)
        } else {
          // Deselect
          setSelectedPiece(null)
          setValidMoves([])
        }
      } else if (pieceAtSquare && pieceAtSquare.color === playerColor) {
        // Select a piece
        const newValidMoves = getValidMoves(pieceAtSquare, pieces)
        setSelectedPiece(pieceAtSquare)
        setValidMoves(newValidMoves)
      }
    },
    [game, playerColor, currentTurn, pieces, selectedPiece, validMoves, makeMove],
  )

  // (Keep resignGame and offerDraw as is)
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
    selectedPiece, // <-- Expose selected piece
    handleSquareClick, // <-- Expose the new click handler
    resignGame,
    offerDraw,
  }
}