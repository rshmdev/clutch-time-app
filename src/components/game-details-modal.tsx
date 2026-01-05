import { useGameWebSocket } from "@/hooks/useGameWebSocket"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, List } from "lucide-react"
import { useEffect, useState } from "react"

interface GameDetailsModalProps {
  gameId: string
  onClose: () => void
}

interface GameDetails {
  gameId: string
  status: string
  statusText: string
  period: number
  gameClock: string
  arena: {
    name: string
    city: string
    state: string
  }
  homeTeam: {
    teamCity: string
    teamName: string
    teamTricode: string
    score: number
    wins: number
    losses: number
    periods: Array<{ period: number; score: number }>
    players: Array<{
      personId: number
      name: string
      nameI: string
      jerseyNum: string
    }>
  }
  awayTeam: {
    teamCity: string
    teamName: string
    teamTricode: string
    score: number
    wins: number
    losses: number
    periods: Array<{ period: number; score: number }>
    players: Array<{
      personId: number
      name: string
      nameI: string
      jerseyNum: string
    }>
  }
  lineScore: Array<{
    teamAbbr: string
    q1: number
    q2: number
    q3: number
    q4: number
    total: number
  }>
  lastFiveMeetings?: {
    meetings: Array<{
      gameDate?: string
      gameTimeUTC: string
      gameStatusText: string
      awayTeam: {
        teamTricode: string
        score: number
      }
      homeTeam: {
        teamTricode: string
        score: number
      }
    }>
  }
}

interface PlayByPlayAction {
  actionNumber: number
  actionType: string
  subType: string
  clock: string
  period: number
  teamTricode: string
  playerNameI: string
  description: string
  scoreHome: string
  scoreAway: string
}

export default function GameDetailsModal({ gameId, onClose }: GameDetailsModalProps) {
  const [details, setDetails] = useState<GameDetails | null>(null)
  const [playByPlay, setPlayByPlay] = useState<PlayByPlayAction[]>([])
  const [loading, setLoading] = useState(true)

  // WebSocket hook
  useGameWebSocket({
    gameId,
    isLive: details?.status === 'live',
    onPlayByPlayUpdate: (actions) => setPlayByPlay(actions),
    onGameUpdate: (updatedDetails) => setDetails(updatedDetails),
  })

  useEffect(() => {
    fetchGameDetails()
    fetchPlayByPlay()
  }, [gameId])

  const fetchGameDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/${gameId}/details`)
      const data = await response.json()
      setDetails(data.details)
    } catch (error) {
      console.error("[v0] Error fetching game details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayByPlay = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/${gameId}/playbyplay`)
      const data = await response.json()
      setPlayByPlay(data.play_by_play || [])
    } catch (error) {
      console.error("[v0] Error fetching play-by-play:", error)
    }
  }

  const isScoringAction = (action: PlayByPlayAction) => {
    const scoringTypes = ['2pt', '3pt', 'freethrow', 'free throw', 'field goal', 'three pointer']
    return scoringTypes.some(type => 
      action.actionType.toLowerCase().includes(type) || 
      action.subType.toLowerCase().includes(type) ||
      action.description.toLowerCase().includes('point') ||
      action.description.toLowerCase().includes('free throw')
    )
  }
    const formatClock = (clock: string) => {
    if (!clock || clock === "") return "-"
    const match = clock.match(/PT(\d+)M([\d.]+)S/)
    if (match) {
      const minutes = match[1]
      const seconds = Math.floor(Number.parseFloat(match[2]))
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
    return clock
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!details) return null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Detalhes do Jogo</DialogTitle>
            <Badge variant="outline" className="font-mono">
              {details.statusText}
            </Badge>
          </div>

          {/* Score Header */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{details.awayTeam.teamCity}</p>
              <p className="text-2xl font-bold">{details.awayTeam.teamTricode}</p>
              <p className="text-4xl font-bold text-foreground mt-2">{details.awayTeam.score}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {details.awayTeam.wins}W - {details.awayTeam.losses}L
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">{details.homeTeam.teamCity}</p>
              <p className="text-2xl font-bold">{details.homeTeam.teamTricode}</p>
              <p className="text-4xl font-bold text-foreground mt-2">{details.homeTeam.score}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {details.homeTeam.wins}W - {details.homeTeam.losses}L
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              {/* <TabsTrigger value="players" className="gap-2">
                <Users className="h-4 w-4" />
                Jogadores
              </TabsTrigger> */}
              <TabsTrigger value="playbyplay" className="gap-2">
                <List className="h-4 w-4" />
                Lance a Lance
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(90vh-300px)]">
            <div className="px-6 pb-6">
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Quarter Scores */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground">PLACAR POR PERÍODO</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Q1</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Q2</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Q3</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Q4</th>
                          <th className="text-center py-2 text-muted-foreground font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.lineScore.map((line) => (
                          <tr key={line.teamAbbr} className="border-b border-border last:border-0">
                            <td className="py-3 font-semibold">{line.teamAbbr}</td>
                            <td className="text-center py-3 tabular-nums">{line.q1 || "-"}</td>
                            <td className="text-center py-3 tabular-nums">{line.q2 || "-"}</td>
                            <td className="text-center py-3 tabular-nums">{line.q3 || "-"}</td>
                            <td className="text-center py-3 tabular-nums">{line.q4 || "-"}</td>
                            <td className="text-center py-3 font-bold tabular-nums">{line.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Last 5 Meetings */}
                {details.lastFiveMeetings && details.lastFiveMeetings?.meetings && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 text-sm text-muted-foreground">ÚLTIMOS 5 CONFRONTOS</h3>
                    <div className="space-y-2">
                      {details.lastFiveMeetings.meetings.map((meeting, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(meeting.gameTimeUTC).toLocaleDateString("pt-BR", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{meeting.awayTeam.teamTricode}</span>
                              <span className="text-muted-foreground">{meeting.awayTeam.score}</span>
                              <span className="text-muted-foreground">×</span>
                              <span className="text-muted-foreground">{meeting.homeTeam.score}</span>
                              <span className="font-semibold">{meeting.homeTeam.teamTricode}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {meeting.gameStatusText}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Arena Info */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground">LOCAL</h3>
                  <p className="font-medium">{details.arena.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {details.arena.city}, {details.arena.state}
                  </p>
                </Card>
              </TabsContent>
{/* 
              <TabsContent value="players" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">
                    {details.awayTeam.teamCity} {details.awayTeam.teamName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {details.awayTeam.players.map((player) => (
                      <div key={player.personId} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs font-bold">#{player.jerseyNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{player.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">
                    {details.homeTeam.teamCity} {details.homeTeam.teamName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {details.homeTeam.players.map((player) => (
                      <div key={player.personId} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-xs font-bold">#{player.jerseyNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{player.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent> */}

              <TabsContent value="playbyplay" className="space-y-2 mt-4">
                {playByPlay.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">Nenhuma ação disponível ainda.</p>
                  </Card>
                ) : (
                  (details.status === 'live' ? playByPlay.slice().reverse() : playByPlay).map((action) => (
                    <Card key={action.actionNumber} className={`p-3 ${isScoringAction(action) ? 'bg-accent' : ''}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {action.teamTricode && (
                              <Badge variant="outline" className="text-xs">
                                {action.teamTricode}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground font-mono">
                              Q{action.period} {formatClock(action.clock)}
                            </span>
                          </div>
                          <p className="text-sm">{action.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-semibold tabular-nums">
                            {action.scoreAway} - {action.scoreHome}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
