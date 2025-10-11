import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get top 100 players by rating
  const { data: topPlayers } = await supabase
    .from("profiles")
    .select("*")
    .order("rating", { ascending: false })
    .limit(100)

  // Get current user's profile
  const { data: currentUserProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Calculate user's rank
  const { count: userRank } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("rating", currentUserProfile?.rating || 0)

  const currentUserRank = (userRank || 0) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <Button asChild variant="outline">
            <Link href="/lobby">Back to Lobby</Link>
          </Button>
        </div>

        {/* Current User Stats */}
        {currentUserProfile && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle>Your Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">#{currentUserRank}</div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg">
                        {currentUserProfile.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{currentUserProfile.display_name}</div>
                      <div className="text-sm text-muted-foreground">@{currentUserProfile.username}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{currentUserProfile.rating}</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{currentUserProfile.wins}</div>
                    <div className="text-xs text-muted-foreground">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{currentUserProfile.losses}</div>
                    <div className="text-xs text-muted-foreground">Losses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{currentUserProfile.draws}</div>
                    <div className="text-xs text-muted-foreground">Draws</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPlayers?.map((player, index) => {
                const isCurrentUser = player.id === user.id
                const totalGames = player.wins + player.losses + player.draws
                const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(1) : "0.0"

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                      isCurrentUser ? "bg-primary/10 border-2 border-primary" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 text-center">
                        {index === 0 && <span className="text-3xl">🥇</span>}
                        {index === 1 && <span className="text-3xl">🥈</span>}
                        {index === 2 && <span className="text-3xl">🥉</span>}
                        {index > 2 && <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{player.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {player.display_name}
                          {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">@{player.username}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold">{player.rating}</div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{player.wins}</div>
                        <div className="text-xs text-muted-foreground">W</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">{player.losses}</div>
                        <div className="text-xs text-muted-foreground">L</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{player.draws}</div>
                        <div className="text-xs text-muted-foreground">D</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{winRate}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {(!topPlayers || topPlayers.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">No players yet. Be the first to play!</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
