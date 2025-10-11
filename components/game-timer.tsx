"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"

interface GameTimerProps {
  initialTime: number
  isActive: boolean
  onTimeUp?: () => void
}

export function GameTimer({ initialTime, isActive, onTimeUp }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)

  useEffect(() => {
    setTimeLeft(initialTime)
  }, [initialTime])

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, timeLeft, onTimeUp])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isLowTime = timeLeft < 60

  return (
    <Card className={`p-4 ${isLowTime ? "bg-destructive/10 border-destructive" : ""}`}>
      <div className="text-center">
        <div className={`text-3xl font-mono font-bold ${isLowTime ? "text-destructive" : ""}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Time Remaining</div>
      </div>
    </Card>
  )
}
