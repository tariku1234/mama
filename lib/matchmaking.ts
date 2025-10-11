"use server"

import { createClient } from "@/lib/supabase/server"

export async function joinGameByCode(userId: string, inviteCode: string) {
  console.log("[v0] joinGameByCode called with:", { userId, inviteCode })

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    // Find game with invite code
    const { data: game, error: findError } = await supabase
      .from("games")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .eq("status", "waiting")
      .is("player2_id", null)
      .single()

    console.log("[v0] Game query result:", { game, findError })

    if (findError || !game) {
      console.log("[v0] Game not found error")
      throw new Error("Game not found or already started")
    }

    if (game.player1_id === userId) {
      console.log("[v0] User trying to join own game")
      throw new Error("You cannot join your own game")
    }

    // Join the game
    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update({
        player2_id: userId,
        status: "active",
      })
      .eq("id", game.id)
      .select()
      .single()

    console.log("[v0] Game update result:", { updatedGame, updateError })

    if (updateError) {
      console.log("[v0] Update error:", updateError)
      throw new Error(`Failed to join game: ${updateError.message}`)
    }

    console.log("[v0] Successfully joined game:", updatedGame)
    return updatedGame
  } catch (error) {
    console.error("[v0] joinGameByCode error:", error)
    throw error
  }
}
