// Server-side functions for use in Server Components only
import { createClient } from "@/lib/supabase/server"
import { initializeBoard } from "@/lib/game-logic"

export async function findOrCreateGameServer(userId: string, gameType: string) {
  const supabase = await createClient()

  // First, check if there's a waiting game with the same game type
  const { data: waitingGames, error: searchError } = await supabase
    .from("games")
    .select("*")
    .eq("status", "waiting")
    .eq("game_type", gameType)
    .is("player2_id", null)
    .neq("player1_id", userId)
    .limit(1)

  if (searchError) {
    throw new Error(`Failed to search for games: ${searchError.message}`)
  }

  if (waitingGames && waitingGames.length > 0) {
    // Join existing game
    const game = waitingGames[0]

    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update({
        player2_id: userId,
        status: "active",
      })
      .eq("id", game.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to join game: ${updateError.message}`)
    }

    return updatedGame
  }

  // No waiting games, create a new one
  const initialBoard = initializeBoard()
  const boardState = {
    pieces: initialBoard,
    currentTurn: "light" as const,
  }

  const { data: newGame, error: createError } = await supabase
    .from("games")
    .insert({
      player1_id: userId,
      status: "waiting",
      current_turn: "player1",
      board_state: boardState,
      game_type: gameType,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create game: ${createError.message}`)
  }

  return newGame
}

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
