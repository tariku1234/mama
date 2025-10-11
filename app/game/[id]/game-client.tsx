"use client"

import { GameBoard } from "@/components/game-board"
import { PlayerInfo } from "@/components/player-info"
import { GameTimer } from "@/components/game-timer"
import { useMultiplayerGame } from "@/lib/hooks/use-multiplayer-game"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Profile {
  id: string
  username: string
  display_name: string
  rating: number
}

interface GameClientProps {
  gameId: string
  userId: string
  player1: Profile | null
  player2: Profile | null
  initialGameStatus: string
}

export function GameClient({ gameId, userId, player1, player2, initialGameStatus }: GameClientProps) {
  const { game, pieces, currentTurn, validMoves, playerColor, isLoading, error, makeMove, resignGame, offerDraw } =
    useMultiplayerGame(gameId, userId)
  const router = useRouter()

  // Redirect if game is completed
  useEffect(() => {
    if (game?.status === "completed") {
      setTimeout(() => {
        router.push(`/game/${gameId}/results`)
      }, 3000)
    }
  }, [game?.status, gameId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-lg">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !game || !player1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 space-y-4">
            <p className="text-lg text-destructive">{error || "Game not found"}</p>
            <Button asChild>
              <Link href="/lobby">Back to Lobby</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPlayer1 = userId === game.player1_id
  const currentPlayer = isPlayer1 ? player1 : player2
  const opponent = isPlayer1 ? player2 : player1

  const isPlayerTurn =
    (playerColor === "light" && currentTurn === "light") || (playerColor === "dark" && currentTurn === "dark")

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Live Game</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/lobby">Exit</Link>
          </Button>
        </div>

        {game.status === "completed" && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-center text-xl md:text-2xl">Game Over!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg mb-4">
                {game.winner_id === userId ? "You won!" : game.winner_id ? "You lost." : "Game ended in a draw."}
              </p>
              <p className="text-sm text-muted-foreground">Redirecting to results...</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-[300px_1fr_300px]">
          {/* Opponent Info */}
          <div className="space-y-4 order-1">
            {opponent ? (
              <>
                <PlayerInfo
                  displayName={opponent.display_name}
                  username={opponent.username}
                  rating={opponent.rating}
                  isCurrentTurn={!isPlayerTurn}
                />
                <GameTimer
                  initialTime={isPlayer1 ? game.player2_time : game.player1_time}
                  isActive={game.status === "active" && !isPlayerTurn}
                />
              </>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-muted-foreground">Waiting for opponent...</CardContent>
              </Card>
            )}
          </div>

          {/* Game Board */}
          <div className="flex justify-center order-2">
            <GameBoard
              pieces={pieces}
              currentTurn={currentTurn}
              onMove={makeMove}
              highlightedSquares={validMoves}
              playerColor={playerColor}
              disabled={game.status !== "active" || !opponent}
            />
          </div>

          {/* Current Player Info */}
          <div className="space-y-4 order-3">
            {currentPlayer && (
              <>
                <PlayerInfo
                  displayName={currentPlayer.display_name}
                  username={currentPlayer.username}
                  rating={currentPlayer.rating}
                  isCurrentTurn={isPlayerTurn}
                />
                <GameTimer
                  initialTime={isPlayer1 ? game.player1_time : game.player2_time}
                  isActive={game.status === "active" && isPlayerTurn}
                />
              </>
            )}

            {/* Game Controls */}
            {game.status === "active" && opponent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Game Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={resignGame} variant="destructive" className="w-full" size="sm">
                    Resign
                  </Button>
                  <Button onClick={offerDraw} variant="outline" className="w-full bg-transparent" size="sm">
                    Offer Draw
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
