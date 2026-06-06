import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    user: DefaultSession['user'] & {
      id?: string
      role?: string
    }
  }

  interface User {
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: string
    picture?: string | null
    accessToken?: string
    refreshToken?: string
  }
}
