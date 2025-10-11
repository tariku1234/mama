"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function JoinPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteCode.trim()) {
      router.push(`/join/${inviteCode.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Game</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Enter Invite Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono text-lg text-center"
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Button type="submit" className="w-full" size="lg" disabled={inviteCode.length !== 6}>
                Join Game
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/lobby">Back to Lobby</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
