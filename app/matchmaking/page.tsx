import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { findOrCreateGameServer } from "@/lib/matchmaking-server"
import { MatchmakingClient } from "./matchmaking-client"

export default async function MatchmakingPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login?redirect=/matchmaking")
  }

  const game = await findOrCreateGameServer(user.id)

  // If game is already active (matched immediately), redirect to game
  if (game.status === "active") {
    redirect(`/game/${game.id}`)
  }

  return <MatchmakingClient gameId={game.id} userId={user.id} />
}
