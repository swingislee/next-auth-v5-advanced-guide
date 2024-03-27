import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"

import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

import authConfig from "./auth.config"
import { getUserById } from "@/data/auth/user" 
import { getTwoFactorConfirmationByUserId } from "@/data/auth/two-factor-confirmation"


/*  derectly use this todo a type clare in "next-auth": "^5.0.0-beta.15", "as any" doesn't need
declare module "next-auth" {
  interface User {
    role?: "ADMIN" | "USER" | "TEACHER" | "STUDENT",
  }
}


declare module '@auth/core/jwt' {
	interface JWT {
    role?: "ADMIN" | "USER" | "TEACHER" | "STUDENT",
	}
}
*/

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  events:{
    async linkAccount({ user }){
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }

  },
  callbacks:{   
    async signIn({ user, account }) {
      // Allow Oauth without email verification
      if (account?.provider === "credentials") {
        const existingUser = await getUserById(user.id);

        if (!existingUser?.emailVerified) return false;

        if (existingUser.isTwoFactorEnabled) {
          const getTwoFactorConfirmation = await getTwoFactorConfirmationByUserId (existingUser.id);

          console.log("getTwoFactorConfirmation",getTwoFactorConfirmation)
          if (!getTwoFactorConfirmation) return false;

          await db.twoFactorConfirmation.delete({
            where: { id: getTwoFactorConfirmation.id}
          })
        }
      }

      return true
    },

    async session({ token,session}){
      if (token.sub && session.user){
        session.user.id = token.sub;
      }
 
      if (token.role && session.user){
        session.user.role = token.role as UserRole; //"next-auth": "^5.0.0-beta.15", "as any" doesn't need
      }

      if (token.isTwoFactorEnabled && session.user){
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean; //"next-auth": "^5.0.0-beta.15", "as any" doesn't need
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub)

      if (!existingUser) return token;

      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token
    }
  },
  adapter: PrismaAdapter(db),
  session: {strategy:"jwt"},
  ...authConfig,
})