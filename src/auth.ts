import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        const emailStr = (credentials.email as string).trim().toLowerCase()
        const passwordStr = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email: emailStr },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordMatch = await bcrypt.compare(passwordStr, user.password)
        if (!isPasswordMatch) {
          return null
        }

        return user
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        if (typeof token.role === "string") {
          session.user.role = token.role
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/signin",
  },
})
