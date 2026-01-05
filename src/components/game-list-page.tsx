"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronRight } from "lucide-react"
import GameDetailsModal from "./game-details-modal"

interface Game {
    gameId: string
    gameDate: string
    homeTeamId: number
    homeTeamName: string
    homeTeamAbbr: string
    awayTeamId: number
    awayTeamName: string
    awayTeamAbbr: string
    status: string
    homeScore: number
    awayScore: number
    quarter?: number
    timeRemaining?: string
    arena?: string
    broadcaster?: string
}

export default function GamesListPage() {
    const [games, setGames] = useState<Game[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
    const [loading, setLoading] = useState(false)
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

    useEffect(() => {
        fetchGames(selectedDate)
    }, [selectedDate])

    const fetchGames = async (date: string) => {
        setLoading(true)
        try {
            // Substitua import.meta.env.VITE_API_URL pela URL da sua API
            const response = await fetch(`import.meta.env.VITE_API_URL/games/${date}`)
            const data = await response.json()

            console.log("[v0] Fetched games data:", data)
            setGames(data.games || [])
        } catch (error) {
            console.error("[v0] Error fetching games:", error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { label: string; variant: "default" | "destructive" | "outline" | "secondary" }
        > = {
            live: { label: "AO VIVO", variant: "destructive" },
            upcoming: { label: "PROGRAMADO", variant: "outline" },
            final: { label: "FINAL", variant: "secondary" },
        }

        const config = statusConfig[status] || { label: status.toUpperCase(), variant: "default" }
        return (
            <Badge variant={config.variant} className="font-mono text-xs">
                {config.label}
            </Badge>
        )
    }

    const changeDate = (days: number) => {
        const date = new Date(selectedDate)
        date.setDate(date.getDate() + days)
        setSelectedDate(date.toISOString().split("T")[0])
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    }

    const formatTimeRemaining = (time: string) => {
        if (!time || time === "") return "-"
        const match = time.match(/PT(\d+)M([\d.]+)S/)
        if (match) {
            const minutes = match[1]
            const seconds = Math.floor(Number.parseFloat(match[2]))
            return `${minutes}:${seconds.toString().padStart(2, "0")}`
        }
        return time
    }


    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/95">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="ClutchTime Logo" className="h-12 w-auto object-contain"
                            />
                        </div>
                        {/* <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                            <TrendingUp className="h-4 w-4" />
                            Análises
                        </Button> */}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Date Selector */}
                <Card className="mb-6 p-4 bg-card/50 backdrop-blur border-border">
                    <div className="flex items-center justify-between gap-4">
                        <Button onClick={() => changeDate(-1)} variant="ghost" size="sm">
                            ←
                        </Button>
                        <div className="flex-1 text-center">
                            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-medium">DATA DOS JOGOS</span>
                            </div>
                            <p className="text-sm font-semibold text-foreground capitalize">{formatDate(selectedDate)}</p>
                        </div>
                        <Button onClick={() => changeDate(1)} variant="ghost" size="sm">
                            →
                        </Button>
                    </div>
                </Card>

                {/* Games List */}
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                        <p className="mt-4">Carregando jogos...</p>
                    </div>
                ) : games.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-muted-foreground">Nenhum jogo encontrado para esta data.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {games.map((game) => (
                            <Card
                                key={game.gameId}
                                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer border-border"
                                onClick={() => setSelectedGameId(game.gameId)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    {getStatusBadge(game.status)}
                                    {game.status === "live" && game.quarter && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                            Q{game.quarter} {formatTimeRemaining(game.timeRemaining || "")}
                                        </span>
                                    )}
                                </div>

                                {/* Teams */}
                                <div className="space-y-3">
                                    {/* Away Team */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center">
                                                <span className="text-lg font-bold text-foreground">{game.awayTeamAbbr}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-foreground">{game.awayTeamName}</p>
                                                <p className="text-xs text-muted-foreground">Visitante</p>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-foreground tabular-nums">{game.awayScore || "-"}</div>
                                    </div>

                                    {/* Home Team */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="h-12 w-12 rounded-lg bg-secondary/50 flex items-center justify-center">
                                                <span className="text-lg font-bold text-foreground">{game.homeTeamAbbr}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-foreground">{game.homeTeamName}</p>
                                                <p className="text-xs text-muted-foreground">Casa</p>
                                            </div>
                                        </div>
                                        <div className="text-3xl font-bold text-foreground tabular-nums">{game.homeScore || "-"}</div>
                                    </div>
                                </div>

                                {/* View Details */}
                                <div className="flex items-center justify-end mt-4 pt-3 border-t border-border">
                                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                        Ver Detalhes
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Game Details Modal */}
            {selectedGameId && <GameDetailsModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />}
        </div>
    )
}
