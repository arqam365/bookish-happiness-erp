import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000')

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    await fetch(`${BACKEND_URL}/api/v1/auth/sign-out`, {
      method: 'POST',
      headers: { Authorization: authHeader },
    }).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}
