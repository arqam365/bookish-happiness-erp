'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth.store'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4001'
const WS_ENABLED = WS_URL.startsWith('http://') // Vercel (https://) has no WS server

export function useAttendanceSocket(onUpdate: (data: { date: string; sectionId: string; count: number }) => void) {
  const token = useAuthStore((s) => s.accessToken)
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  useEffect(() => {
    if (!token || !WS_ENABLED) return

    const socket: Socket = io(`${WS_URL}/attendance`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    })

    socket.on('attendance:updated', (data) => cbRef.current(data))
    return () => { socket.disconnect() }
  }, [token])
}

export function useNotificationSocket(onNotification: (n: { id: string; title: string; body: string; createdAt: string }) => void) {
  const token = useAuthStore((s) => s.accessToken)
  const cbRef = useRef(onNotification)
  cbRef.current = onNotification

  useEffect(() => {
    if (!token || !WS_ENABLED) return

    const socket: Socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    })

    socket.on('notification:new', (data) => cbRef.current(data))
    return () => { socket.disconnect() }
  }, [token])
}
