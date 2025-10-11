"use client"

import { GameBoard } from "@/components/game-board"
import { useGameState } from "@/lib/hooks/use-game-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function TestGamePage() {
  const { pieces, currentTurn, validMoves, winner, makeMove, resetGame } = useGameState()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Test Game</h1>
          <Button asChild variant="outline">
            <Link href="/lobby">Back to Lobby</Link>
          </Button>
        </div>

        {winner && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                {winner === "light" ? "Light" : "Dark"} Player Wins!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={resetGame} size="lg">
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <GameBoard
            pieces={pieces}
            currentTurn={currentTurn}
            onMove={makeMove}
            highlightedSquares={validMoves}
            playerColor={currentTurn}
            disabled={!!winner}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Game Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={resetGame} variant="outline" className="flex-1 bg-transparent">
                Reset Game
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>How to play:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click or drag a piece to select it</li>
                <li>Valid moves will be highlighted in green</li>
                <li>Pieces move diagonally forward</li>
                <li>Jump over opponent pieces to capture them</li>
                <li>Reach the opposite end to become a king</li>
                <li>Kings can move backward</li>
                <li>Captures are mandatory when available</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
