import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { generateToken, hashToken } from "@/lib/security/tokens";
import { normalizeEmail } from "@/lib/utils";
import type { Role, UserStatus } from "@prisma/client";
import { AuthError } from "@/lib/errors";
import {
  clearLoginFailures,
  isAccountLocked,
  recordFailedLogin,
} from "@/server/auth/lockout";

const SESSION_INACTIVITY_MS = 8 * 60 * 60 * 1000;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      status: UserStatus;
      sessionId: string;
    };
  }

  interface User {
    role: Role;
    status: UserStatus;
    sessionId: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    status?: UserStatus;
    sessionId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: SESSION_INACTIVITY_MS / 1000 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "");
        const password = String(credentials?.password || "");
        if (!email || !password) {
          throw new AuthError("Invalid email or password");
        }

        const emailNormalized = normalizeEmail(email);
        const user = await prisma.user.findUnique({
          where: { emailNormalized },
        });

        if (!user || user.deletedAt) {
          throw new AuthError("Invalid email or password");
        }

        if (user.status === "SUSPENDED") {
          throw new AuthError("Invalid email or password");
        }

        if (isAccountLocked(user.lockedUntil)) {
          throw new AuthError("Invalid email or password");
        }

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) {
          await recordFailedLogin(user.id);
          throw new AuthError("Invalid email or password");
        }

        const rawToken = generateToken(32);
        const session = await prisma.session.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(rawToken),
            expiresAt: new Date(Date.now() + SESSION_INACTIVITY_MS),
            lastActiveAt: new Date(),
          },
        });

        await clearLoginFailures(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          sessionId: session.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.sessionId = user.sessionId;
      }

      if (!token.sessionId || !token.id) {
        return {};
      }

      const session = await prisma.session.findUnique({
        where: { id: token.sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      });

      if (
        !session ||
        session.revokedAt ||
        session.expiresAt < new Date() ||
        session.user.deletedAt ||
        session.user.status === "SUSPENDED"
      ) {
        return {};
      }

      const inactiveMs = Date.now() - session.lastActiveAt.getTime();
      if (inactiveMs > SESSION_INACTIVITY_MS) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        return {};
      }

      await prisma.session.update({
        where: { id: session.id },
        data: {
          lastActiveAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_INACTIVITY_MS),
        },
      });

      token.id = session.user.id;
      token.email = session.user.email;
      token.name = session.user.name;
      token.role = session.user.role;
      token.status = session.user.status;
      token.sessionId = session.id;
      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.sessionId) {
        return { ...session, user: undefined as never };
      }
      session.user = {
        id: token.id,
        email: String(token.email || ""),
        name: String(token.name || ""),
        role: token.role as Role,
        status: token.status as UserStatus,
        sessionId: token.sessionId,
        emailVerified: null,
      } as typeof session.user;
      return session;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function revokeCurrentSession() {
  const session = await auth();
  if (session?.user?.sessionId) {
    await prisma.session.update({
      where: { id: session.user.sessionId },
      data: { revokedAt: new Date() },
    });
  }
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
