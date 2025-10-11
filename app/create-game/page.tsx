import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createPrivateGameServer } from "@/lib/matchmaking-server"
import { CreateGameClient } from "./create-game-client"

export default async function CreateGamePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const game = await createPrivateGameServer(user.id)

  return <CreateGameClient gameId={game.id} inviteCode={game.invite_code!} userId={user.id} />
}
