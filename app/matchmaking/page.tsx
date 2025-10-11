'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MatchmakingClient } from './matchmaking-client'
import { findOrCreateGame } from './actions'

function Matchmaking() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameType = searchParams.get('gameType')
  const [gameId, setGameId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      if (!gameType) {
        console.error("No game type specified")
        router.push('/lobby')
        return;
      }
      try {
        const game = await findOrCreateGame(gameType)

        if (game.status === 'active') {
          router.push(`/game/${game.id}`)
        } else {
          setGameId(game.id)
          setUserId(game.player1_id)
        }
      } catch (error) {
        console.error('Error finding or creating game:', error)
        router.push('/lobby')
      }
    }

    initialize()
  }, [gameType, router])

  if (!gameId || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <MatchmakingClient gameId={gameId} userId={userId} />
}

export default function MatchmakingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      <Matchmaking />
    </Suspense>
  )
}
