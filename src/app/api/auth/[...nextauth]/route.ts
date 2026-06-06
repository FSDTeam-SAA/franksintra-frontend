/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { axiosInstance } from '@/lib/axios'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim()
        const password = credentials?.password

        if (!email || !password) {
          return null
        }

        try {
          const response = await axiosInstance.post('/auth/login', {
            email,
            password,
          })

          const payload = response.data?.data
          if (!payload?.user || !payload?.accessToken) {
            return null
          }

          return {
            id: payload.user._id,
            name: payload.user.name,
            email: payload.user.email,
            role: payload.user.role,
            image: payload.user.profileImage ?? null,
            accessToken: payload.accessToken,
            refreshToken: payload.user.refreshToken,
          } as any
        } catch {
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id
        token.role = (user as any).role
        token.picture = (user as any).image ?? null
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.image = (token.picture as string | null) ?? null
      }

      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string

      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST };
