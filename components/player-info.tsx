import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface PlayerInfoProps {
  displayName: string
  username: string
  rating: number
  isCurrentTurn: boolean
}

export function PlayerInfo({ displayName, username, rating, isCurrentTurn }: PlayerInfoProps) {
  return (
    <Card className={`p-4 ${isCurrentTurn ? "ring-2 ring-primary" : ""}`}>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-lg font-semibold">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{displayName}</div>
          <div className="text-sm text-muted-foreground truncate">@{username}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">Rating</div>
          <div className="text-lg font-bold">{rating}</div>
        </div>
      </div>
      {isCurrentTurn && <div className="mt-2 text-xs font-medium text-primary text-center">Current Turn</div>}
    </Card>
  )
}
