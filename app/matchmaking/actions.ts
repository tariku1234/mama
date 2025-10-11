'use server'

import { createClient } from '@/lib/supabase/server'
import { findOrCreateGameServer } from '@/lib/matchmaking-server'
import { redirect } from 'next/navigation'

export async function findOrCreateGame(gameType: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return findOrCreateGameServer(user.id, gameType)
}
