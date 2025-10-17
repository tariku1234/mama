"use client"

import { useCallback } from "react"
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
  handleSquareClick: (row: number, col: number) => void
  highlightedSquares?: { row: number; col: number }[]
  selectedPiece: Piece | null
  playerColor: PieceColor
  disabled?: boolean
}

export function GameBoard({
  pieces,
  currentTurn,
  handleSquareClick,
  highlightedSquares = [],
  selectedPiece,
  playerColor,
  disabled = false,
}: GameBoardProps) {
  const getPieceAtPosition = useCallback(
    (row: number, col: number) => {
      return pieces.find((p) => p.position.row === row && p.position.col === col)
    },
    [pieces],
  )

  const isSquareDark = (row: number, col: number) => {
    return (row + col) % 2 === 1
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg font-semibold">
        {currentTurn === playerColor ? "Your Turn" : "Opponent's Turn"}
      </div>

      <div className="grid grid-cols-8 gap-0 border-4 border-amber-900 shadow-2xl bg-amber-900 rounded-lg overflow-hidden">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const piece = getPieceAtPosition(row, col)
            const isHighlighted = highlightedSquares.some((square) => square.row === row && square.col === col)
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
              >
                {piece && (
                  <div
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-transform hover:scale-110",
                      piece.color === "light"
                        ? "bg-gradient-to-br from-red-400 to-red-600 text-white"
                        : "bg-gradient-to-br from-gray-800 to-black text-white",
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
