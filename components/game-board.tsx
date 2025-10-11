"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

export type PieceType = "regular" | "king"
export type PieceColor = "light" | "dark"

export interface Piece {
  id: string
  type: PieceType
  color: PieceColor
  position: { row: number; col: number }
}

export interface GameBoardProps {
  pieces: Piece[]
  currentTurn: PieceColor
  onMove: (pieceId: string, newPosition: { row: number; col: number }) => void
  highlightedSquares?: { row: number; col: number }[]
  playerColor: PieceColor
  disabled?: boolean
}

export function GameBoard({
  pieces,
  currentTurn,
  onMove,
  highlightedSquares = [],
  playerColor,
  disabled = false,
}: GameBoardProps) {
  const [draggedPiece, setDraggedPiece] = useState<Piece | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)

  const handleDragStart = useCallback(
    (piece: Piece) => {
      if (disabled || piece.color !== currentTurn || piece.color !== playerColor) return
      setDraggedPiece(piece)
      setSelectedPiece(piece)
    },
    [currentTurn, playerColor, disabled],
  )

  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null)
  }, [])

  const handleDrop = useCallback(
    (row: number, col: number) => {
      if (!draggedPiece) return

      const isValidMove = highlightedSquares.some((square) => square.row === row && square.col === col)

      if (isValidMove) {
        onMove(draggedPiece.id, { row, col })
        setSelectedPiece(null)
      }

      setDraggedPiece(null)
    },
    [draggedPiece, highlightedSquares, onMove],
  )

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (disabled) return

      const pieceAtSquare = pieces.find((p) => p.position.row === row && p.position.col === col)

      if (selectedPiece) {
        const isValidMove = highlightedSquares.some((square) => square.row === row && square.col === col)

        if (isValidMove) {
          onMove(selectedPiece.id, { row, col })
          setSelectedPiece(null)
        } else if (pieceAtSquare && pieceAtSquare.color === currentTurn && pieceAtSquare.color === playerColor) {
          setSelectedPiece(pieceAtSquare)
        } else {
          setSelectedPiece(null)
        }
      } else if (pieceAtSquare && pieceAtSquare.color === currentTurn && pieceAtSquare.color === playerColor) {
        setSelectedPiece(pieceAtSquare)
      }
    },
    [selectedPiece, pieces, highlightedSquares, currentTurn, playerColor, onMove, disabled],
  )

  const isSquareHighlighted = (row: number, col: number) => {
    return highlightedSquares.some((square) => square.row === row && square.col === col)
  }

  const getPieceAtPosition = (row: number, col: number) => {
    return pieces.find((p) => p.position.row === row && p.position.col === col)
  }

  const isSquareDark = (row: number, col: number) => {
    return (row + col) % 2 === 1
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg font-semibold">{currentTurn === playerColor ? "Your Turn" : "Opponent's Turn"}</div>

      <div className="grid grid-cols-8 gap-0 border-4 border-amber-900 shadow-2xl bg-amber-900 rounded-lg overflow-hidden">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const piece = getPieceAtPosition(row, col)
            const isHighlighted = isSquareHighlighted(row, col)
            const isDark = isSquareDark(row, col)
            const isSelected = selectedPiece?.position.row === row && selectedPiece?.position.col === col

            return (
              <div
                key={`${row}-${col}`}
                className={cn(
                  "w-16 h-16 md:w-20 md:h-20 flex items-center justify-center relative cursor-pointer transition-colors",
                  isDark ? "bg-amber-800" : "bg-amber-100",
                  isHighlighted && "ring-4 ring-green-400 ring-inset",
                  isSelected && "ring-4 ring-blue-400 ring-inset",
                )}
                onClick={() => handleSquareClick(row, col)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(row, col)}
              >
                {piece && (
                  <div
                    draggable={!disabled && piece.color === currentTurn && piece.color === playerColor}
                    onDragStart={() => handleDragStart(piece)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-xl cursor-grab active:cursor-grabbing shadow-lg transition-transform hover:scale-110",
                      piece.color === "light"
                        ? "bg-gradient-to-br from-red-400 to-red-600 text-white"
                        : "bg-gradient-to-br from-gray-800 to-black text-white",
                      draggedPiece?.id === piece.id && "opacity-50",
                    )}
                  >
                    {piece.type === "king" && "♔"}
                  </div>
                )}
              </div>
            )
          }),
        )}
      </div>

      <div className="flex gap-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600" />
          <span>Light Pieces</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-800 to-black" />
          <span>Dark Pieces</span>
        </div>
      </div>
    </div>
  )
}
