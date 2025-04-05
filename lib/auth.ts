import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

type ExtendedUser = DefaultSession["user"] & {
  id: string;
};
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
  }
}

export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  
  session: { strategy: "jwt" },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  callbacks: {
    jwt: async ({ token }): Promise<JWT> => {
      const userRecord = await prisma.user.findUnique({
        where: { email: token.email || "" },
        select: { id: true, credits: true },
      });
      
      if (userRecord) {
        return {
          ...token,
          userId: userRecord.id,
          creditBalance: userRecord.credits,
        };
      }
      
      return token;
    },

    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.userId,
        name: token.name,
        email: token.email,
        image: token.picture,
        creditBalance: token.creditBalance,
      },
    }),
  },
};

export const getCurrentUserSession = async () => await getServerSession(authConfig);