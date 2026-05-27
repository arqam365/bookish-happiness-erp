import { createAuthClient } from 'better-auth/client';

const backendUrl =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_BACKEND_URL ??
        process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ??
        'http://localhost:4000')
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000');

if (typeof window !== 'undefined') {
  console.log('[auth-client] resolved backendUrl:', backendUrl);
}

export const authClient = createAuthClient({
  baseURL: backendUrl,
  basePath: '/api/v1/auth',
});

export type Session = typeof authClient.$Infer.Session;
