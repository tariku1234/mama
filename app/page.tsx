import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight text-balance">Dama Online</h1>
          <p className="text-xl text-muted-foreground text-balance">
            Play Ethiopian Checkers against players worldwide
          </p>
        </div>

        <Card className="border-2">
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="text-4xl">♟️</div>
                <h3 className="font-semibold">Real-time Gameplay</h3>
                <p className="text-sm text-muted-foreground">Play live matches with instant move updates</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">🎯</div>
                <h3 className="font-semibold">Matchmaking</h3>
                <p className="text-sm text-muted-foreground">Find opponents or invite friends to play</p>
              </div>
              <div className="space-y-2">
                <div className="text-4xl">🏆</div>
                <h3 className="font-semibold">Leaderboards</h3>
                <p className="text-sm text-muted-foreground">Compete for the top spot on the rankings</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg bg-transparent">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
