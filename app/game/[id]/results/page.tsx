import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function GameResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: game } = await supabase.from("games").select("*").eq("id", id).single()

  if (!game || game.status !== "completed") {
    redirect("/lobby")
  }

  const { data: player1 } = await supabase.from("profiles").select("*").eq("id", game.player1_id).single()

  const { data: player2 } = game.player2_id
    ? await supabase.from("profiles").select("*").eq("id", game.player2_id).single()
    : { data: null }

  const isWinner = game.winner_id === user.id
  const isDraw = !game.winner_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">{isDraw ? "Draw!" : isWinner ? "Victory!" : "Defeat"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-semibold">{player1?.display_name}</div>
                <div className="text-sm text-muted-foreground">@{player1?.username}</div>
              </div>
              <div className="text-2xl font-bold">{game.winner_id === game.player1_id ? "🏆" : ""}</div>
            </div>

            {player2 && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <div className="font-semibold">{player2.display_name}</div>
                  <div className="text-sm text-muted-foreground">@{player2.username}</div>
                </div>
                <div className="text-2xl font-bold">{game.winner_id === game.player2_id ? "🏆" : ""}</div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg">
              <Link href="/lobby">Back to Lobby</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
