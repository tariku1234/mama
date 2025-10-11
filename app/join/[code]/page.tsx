import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JoinGameClient } from "./join-game-client"

export default async function JoinGamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  if (!code || code.length !== 6) {
    throw new Error("Invalid invite code format")
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect(`/auth/login?redirect=/join/${code}`)
  }

  return <JoinGameClient inviteCode={code} userId={user.id} />
}
