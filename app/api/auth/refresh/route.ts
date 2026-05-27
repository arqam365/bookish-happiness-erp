import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000')

export async function POST(req: NextRequest) {
  // Prefer the app_session cookie; fall back to Authorization header sent by AuthHydrator.
  const appSession = req.cookies.get('app_session')?.value
  const bearerHeader = req.headers.get('authorization')
  const token = appSession ?? (bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null)

  if (!token) {
    return NextResponse.json({ error: 'no session' }, { status: 401 })
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/auth/get-session`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)

  if (!res?.ok) {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 })
  }

  return NextResponse.json({ accessToken: token })
}
