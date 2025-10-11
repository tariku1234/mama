import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GameClient } from "./game-client"

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch game data
  const { data: game, error } = await supabase.from("games").select("*").eq("id", id).single()

  if (error || !game) {
    redirect("/lobby")
  }

  // Fetch player profiles
  const { data: player1 } = await supabase.from("profiles").select("*").eq("id", game.player1_id).single()

  const { data: player2 } = game.player2_id
    ? await supabase.from("profiles").select("*").eq("id", game.player2_id).single()
    : { data: null }

  return <GameClient gameId={id} userId={user.id} player1={player1} player2={player2} initialGameStatus={game.status} />
}
