// Server-side functions for use in Server Components only
import { createClient } from "@/lib/supabase/server"
import { initializeBoard, GameType } from "@/lib/game-logic"

export async function createPrivateGameServer(userId: string) {
  const supabase = await createClient()

  const gameType: GameType = "soldier"
  const initialBoard = initializeBoard(gameType)
  const boardState = {
    pieces: initialBoard,
    currentTurn: "light" as const,
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: newGame, error: createError } = await supabase
    .from("games")
    .insert({
      player1_id: userId,
      status: "waiting",
      current_turn: "light",
      board_state: boardState,
      game_type: gameType,
      invite_code: inviteCode,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Failed to create private game: ${createError.message}`)
  }

  return newGame
}

export async function findOrCreateQuickGame(userId: string, gameType: GameType) {
  const supabase = await createClient()

  // 1. Look for a waiting game that is not ours
  const { data: waitingGame, error: findError } = await supabase
    .from("games")
    .select("id")
    .eq("status", "waiting")
    .eq("game_type", gameType)
    .is("player2_id", null)
    .not("player1_id", "eq", userId)
    .limit(1)
    .single()

  if (findError && findError.code !== 'PGRST116') {
    console.error("Error finding waiting game:", findError.message)
    throw new Error("Failed to find a game.")
  }

  // 2. If a waiting game is found, join it and activate it
  if (waitingGame) {
    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update({
        player2_id: userId,
        status: "active", // The game is now active!
      })
      .eq("id", waitingGame.id)
      .select("id")
      .single()

    if (updateError) {
      console.error("Error joining game:", updateError.message)
      throw new Error("Failed to join the game.")
    }

    return updatedGame
  }

  // 3. If no game is found, create a new one with an initialized board and wait
  const initialBoard = initializeBoard(gameType)
  const boardState = {
    pieces: initialBoard,
    currentTurn: "light" as const,
  }

  const { data: newGame, error: createError } = await supabase
    .from("games")
    .insert({
      player1_id: userId,
      status: "waiting",
      game_type: gameType,
      current_turn: "light",
      board_state: boardState, // Initialize the board now
    })
    .select("id")
    .single()

  if (createError) {
    console.error("Error creating new game:", createError.message)
    throw new Error("Failed to create a new game.")
  }

  return newGame
}
