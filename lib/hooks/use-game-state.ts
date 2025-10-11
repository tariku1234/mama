"use client"

import { useState, useCallback, useEffect } from "react"
import type { Piece, PieceColor } from "@/components/game-board"
import { initializeBoard, getValidMoves, executeMove, checkWinCondition } from "@/lib/game-logic"

export function useGameState(initialPieces?: Piece[], initialTurn?: PieceColor) {
  const [pieces, setPieces] = useState<Piece[]>(initialPieces || initializeBoard())
  const [currentTurn, setCurrentTurn] = useState<PieceColor>(initialTurn || "light")
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [validMoves, setValidMoves] = useState<{ row: number; col: number }[]>([])
  const [winner, setWinner] = useState<PieceColor | null>(null)
  const [moveHistory, setMoveHistory] = useState<
    Array<{ from: { row: number; col: number }; to: { row: number; col: number } }>
  >([])

  // Update pieces when initial pieces change (for multiplayer sync)
  useEffect(() => {
    if (initialPieces) {
      setPieces(initialPieces)
    }
  }, [initialPieces])

  // Update turn when initial turn changes (for multiplayer sync)
  useEffect(() => {
    if (initialTurn) {
      setCurrentTurn(initialTurn)
    }
  }, [initialTurn])

  // Check for winner after each move
  useEffect(() => {
    const winnerColor = checkWinCondition(pieces, currentTurn)
    if (winnerColor) {
      setWinner(winnerColor)
    }
  }, [pieces, currentTurn])

  const selectPiece = useCallback(
    (pieceId: string) => {
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece || piece.color !== currentTurn) return

      setSelectedPieceId(pieceId)
      const moves = getValidMoves(piece, pieces)
      setValidMoves(moves)
    },
    [pieces, currentTurn],
  )

  const makeMove = useCallback(
    (pieceId: string, newPosition: { row: number; col: number }) => {
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece) return false

      const moves = getValidMoves(piece, pieces)
      const isValidMove = moves.some((m) => m.row === newPosition.row && m.col === newPosition.col)

      if (!isValidMove) return false

      // Record move history
      setMoveHistory((prev) => [...prev, { from: piece.position, to: newPosition }])

      // Execute the move
      const updatedPieces = executeMove(pieces, pieceId, newPosition)
      setPieces(updatedPieces)

      // Check if this was a capture and if multi-jump is possible
      const rowDiff = Math.abs(newPosition.row - piece.position.row)
      if (rowDiff === 2) {
        // This was a capture - check for additional captures
        const movedPiece = updatedPieces.find((p) => p.id === pieceId)
        if (movedPiece) {
          const additionalCaptures = getValidMoves(movedPiece, updatedPieces).filter((move) => {
            const rowDiff = Math.abs(move.row - movedPiece.position.row)
            return rowDiff === 2
          })

          if (additionalCaptures.length > 0) {
            // Multi-jump available - keep same turn
            setSelectedPieceId(pieceId)
            setValidMoves(additionalCaptures)
            return true
          }
        }
      }

      // Switch turns
      setCurrentTurn((prev) => (prev === "light" ? "dark" : "light"))
      setSelectedPieceId(null)
      setValidMoves([])

      return true
    },
    [pieces, currentTurn],
  )

  const resetGame = useCallback(() => {
    setPieces(initializeBoard())
    setCurrentTurn("light")
    setSelectedPieceId(null)
    setValidMoves([])
    setWinner(null)
    setMoveHistory([])
  }, [])

  return {
    pieces,
    currentTurn,
    selectedPieceId,
    validMoves,
    winner,
    moveHistory,
    selectPiece,
    makeMove,
    resetGame,
    setPieces,
    setCurrentTurn,
  }
}
