import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get user's recent games
  const { data: recentGames } = await supabase
    .from("games")
    .select(
      `
      *,
      player1:profiles!games_player1_id_fkey(username, display_name),
      player2:profiles!games_player2_id_fkey(username, display_name)
    `,
    )
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10)

  // Calculate user's rank
  const { count: userRank } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("rating", profile?.rating || 0)

  const currentUserRank = (userRank || 0) + 1

  const totalGames = (profile?.wins || 0) + (profile?.losses || 0) + (profile?.draws || 0)
  const winRate = totalGames > 0 ? (((profile?.wins || 0) / totalGames) * 100).toFixed(1) : "0.0"

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Profile</h1>
          <Button asChild variant="outline">
            <Link href="/lobby">Back to Lobby</Link>
          </Button>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-4xl">{profile?.display_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-3xl font-bold">{profile?.display_name}</h2>
                <p className="text-lg text-muted-foreground">@{profile?.username}</p>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">#{currentUserRank}</div>
                <div className="text-sm text-muted-foreground">Global Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">{profile?.rating || 1000}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">{totalGames}</div>
                  <div className="text-sm text-muted-foreground">Total Games</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{profile?.wins || 0}</div>
                  <div className="text-sm text-muted-foreground">Wins</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{profile?.losses || 0}</div>
                  <div className="text-sm text-muted-foreground">Losses</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{profile?.draws || 0}</div>
                  <div className="text-sm text-muted-foreground">Draws</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">{winRate}%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" size="lg">
                <Link href="/matchmaking">Find Match</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
                <Link href="/leaderboard">View Leaderboard</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent" size="lg">
                <Link href="/test-game">Practice Mode</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentGames?.map((game) => {
                const isPlayer1 = game.player1_id === user.id
                const opponent = isPlayer1 ? game.player2 : game.player1
                const won = game.winner_id === user.id
                const draw = !game.winner_id

                return (
                  <div key={game.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{draw ? "🤝" : won ? "🏆" : "❌"}</div>
                      <div>
                        <div className="font-semibold">
                          {draw ? "Draw" : won ? "Victory" : "Defeat"} vs {opponent?.display_name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(game.completed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {game.game_type === "random" ? "Ranked" : "Private"}
                    </div>
                  </div>
                )
              })}

              {(!recentGames || recentGames.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No games played yet. Start your first match!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
