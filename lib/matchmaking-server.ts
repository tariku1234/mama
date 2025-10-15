// Server-side functions for use in Server Components only
import { createClient } from "@/lib/supabase/server"
import { initializeBoard } from "@/lib/game-logic"

export async function createPrivateGameServer(userId: string) {
  const supabase = await createClient()

  const initialBoard = initializeBoard()
  const boardState = {
    pieces: initialBoard,
    currentTurn: "light" as const,
  }

  // Generate a random 6-character invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: newGame, error: createError } = await supabase
    .from("games")
    .insert({
      player1_id: userId,
      status: "waiting",
      current_turn: "player1",
      board_state: boardState,
      game_type: "invite",
      invite_code: inviteCode,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create private game: ${createError.message}`)
  }

  return newGame
}
