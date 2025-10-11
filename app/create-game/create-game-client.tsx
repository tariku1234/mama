"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateGameClientProps {
  gameId: string
  inviteCode: string
  userId: string
}

export function CreateGameClient({ gameId, inviteCode, userId }: CreateGameClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/join/${inviteCode}` : ""

  useEffect(() => {
    // Subscribe to game updates
    const channel = supabase
      .channel(`private-game:${gameId}`)
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
            // Opponent joined, redirect to game
            router.push(`/game/${game.id}`)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, router, supabase])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancel = async () => {
    await supabase.from("games").delete().eq("id", gameId).eq("player1_id", userId)
    router.push("/lobby")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Private Game Created</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <div className="flex gap-2">
                <Input value={inviteCode} readOnly className="font-mono text-lg text-center" />
                <Button onClick={handleCopy} variant="outline">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="text-sm" />
                <Button onClick={handleCopy} variant="outline">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="animate-pulse h-3 w-3 bg-primary rounded-full"></div>
            </div>
            <p className="text-muted-foreground">Waiting for opponent to join...</p>
            <p className="text-sm text-muted-foreground">Share the code or link with your friend</p>
          </div>

          <Button onClick={handleCancel} variant="outline" className="w-full bg-transparent">
            Cancel Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
