"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface MatchmakingClientProps {
  gameId: string
  userId: string
}

export function MatchmakingClient({ gameId, userId }: MatchmakingClientProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to game updates for real-time feedback
    const channel = supabase
      .channel(`matchmaking:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const game = payload.new as { status: string; id: string }
          if (game.status === "active") {
            router.push(`/game/${game.id}`)
          }
        },
      )
      .subscribe()

    // Polling as a fallback for missed real-time events
    const pollInterval = setInterval(async () => {
      const { data: game, error } = await supabase
        .from("games")
        .select("status, id")
        .eq("id", gameId)
        .single()

      if (error) {
        console.error("Error polling for game status:", error)
        return
      }

      if (game && game.status === "active") {
        router.push(`/game/${game.id}`)
      }
    }, 3000) // Poll every 3 seconds

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [gameId, router, supabase])

  const handleCancel = async () => {
    // Delete the waiting game
    await supabase.from("games").delete().eq("id", gameId).eq("player1_id", userId)
    router.push("/lobby")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Finding Opponent...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Searching for an available player</p>
            <p className="text-sm text-muted-foreground">This may take a moment...</p>
          </div>

          <Button onClick={handleCancel} variant="outline" className="w-full bg-transparent">
            Cancel Search
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
