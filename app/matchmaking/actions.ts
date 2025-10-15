'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function findOrCreateGame(gameType: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data, error } = await supabase.rpc('find_or_create_game', {
    p_user_id: user.id,
    p_game_type: gameType,
  })

  if (error) {
    console.error('Error finding or creating game:', error)
    throw new Error('Failed to find or create game.')
  }

  return data
}
