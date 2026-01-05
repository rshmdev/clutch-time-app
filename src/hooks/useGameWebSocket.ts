// src/hooks/useGameWebSocket.ts
import { useEffect, useRef } from 'react'

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

interface UseGameWebSocketProps {
  gameId: string
  isLive: boolean
  onPlayByPlayUpdate: (actions: PlayByPlayAction[]) => void
  onGameUpdate: (details: GameDetails) => void
}

export const useGameWebSocket = ({
  gameId,
  isLive,
  onPlayByPlayUpdate,
  onGameUpdate,
}: UseGameWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!isLive || !gameId) return

    const wsUrl = `ws://${import.meta.env.VITE_API_URL}/ws/games/${gameId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected to game', gameId)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'playbyplay_update') {
          onPlayByPlayUpdate(data.data)
        } else if (data.type === 'game_update') {
          onGameUpdate(data.data)
        }
      } catch (error) {
        console.error('[WS] Error parsing message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected from game', gameId)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [gameId, isLive, onPlayByPlayUpdate, onGameUpdate])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  }
}