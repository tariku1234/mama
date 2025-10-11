"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { joinGameByCode } from "@/lib/matchmaking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface JoinGameClientProps {
  inviteCode: string
  userId: string
}

export function JoinGameClient({ inviteCode, userId }: JoinGameClientProps) {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)

    try {
      const game = await joinGameByCode(userId, inviteCode)
      router.push(`/game/${game.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game")
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Private Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">You&apos;ve been invited to join a game</p>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Invite Code</p>
              <p className="text-2xl font-mono font-bold">{inviteCode}</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleJoin} disabled={isJoining} className="w-full" size="lg">
              {isJoining ? "Joining..." : "Join Game"}
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/lobby">Back to Lobby</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
