import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function LobbyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Game Lobby</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.display_name}!</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/profile">Profile</Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Quick Match</CardTitle>
              <CardDescription>Find a random opponent and start playing immediately</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/matchmaking" method="GET" className="space-y-4">
                <Select name="gameType" defaultValue="soldier">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a game mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soldier">Soldier</SelectItem>
                    <SelectItem value="tank">Tank</SelectItem>
                    {/* Add more game modes as needed */}
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full" size="lg">
                  Find Opponent
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create Private Game</CardTitle>
              <CardDescription>Create a game and invite a friend with a code</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-transparent" size="lg" variant="outline">
                <Link href="/create-game">Create Game</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join Private Game</CardTitle>
              <CardDescription>Enter an invite code to join a friend&apos;s game</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-transparent" size="lg" variant="outline">
                <Link href="/join">Enter Code</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold">{profile?.rating || 1000}</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-green-600">{profile?.wins || 0}</div>
                <div className="text-sm text-muted-foreground">Wins</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-red-600">{profile?.losses || 0}</div>
                <div className_name="text-sm text-muted-foreground">Losses</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{profile?.draws || 0}</div>
                <div className="text-sm text-muted-foreground">Draws</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Practice Mode</CardTitle>
              <CardDescription>Play offline to test your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/test-game">Practice Game</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>See the top players</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/leaderboard">View Rankings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
