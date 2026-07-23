import "server-only";

import crypto from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { AUTH_EVENT_TYPES, logAuthEvent } from "@/lib/authEvents";
import { getRequestMetaFromCurrentHeaders, getRequestMetaFromRequest } from "@/lib/requestMeta";

type OAuthProfile = Record<string, unknown>;

function normalizeAuthUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

if (process.env.NEXTAUTH_URL?.trim()) {
  process.env.NEXTAUTH_URL = normalizeAuthUrl(process.env.NEXTAUTH_URL);
}

if (!process.env.NEXTAUTH_URL?.trim() && process.env.VERCEL_URL?.trim()) {
  process.env.NEXTAUTH_URL = normalizeAuthUrl(process.env.VERCEL_URL);
}

const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.NEXTAUTH_SECRET?.trim() || process.env.SESSION_SECRET?.trim() || "";

function resolveAppUrl() {
  return process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : "http://localhost:3000");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createAppleClientSecret() {
  const directSecret = process.env.APPLE_CLIENT_SECRET?.trim();
  if (directSecret) return directSecret;

  const appleClientId = process.env.APPLE_CLIENT_ID?.trim() || process.env.APPLE_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!appleClientId || !teamId || !keyId || !privateKey) return "";

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "ES256",
      kid: keyId,
      typ: "JWT"
    })
  );

  const payload = base64UrlEncode(
    JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + 60 * 60 * 24 * 180,
      aud: "https://appleid.apple.com",
      sub: appleClientId
    })
  );

  const signer = crypto.createSign("SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  const signature = signer.sign(privateKey, "base64url");
  return `${header}.${payload}.${signature}`;
}


async function ensureUserProfile(params: {
  userId: string;
  name?: string | null;
  locale?: string | null;
}) {
  const existing = await prisma.userProfile.findUnique({
    where: { userId: params.userId },
    select: {
      id: true,
      displayName: true,
      locale: true
    }
  });

  if (!existing) {
    await prisma.userProfile.create({
      data: {
        userId: params.userId,
        displayName: params.name ?? null,
        locale: params.locale ?? null
      }
    });
    return;
  }

  const data: { displayName?: string; locale?: string } = {};

  if (!existing.displayName && params.name) {
    data.displayName = params.name;
  }

  if (!existing.locale && params.locale) {
    data.locale = params.locale;
  }

  if (Object.keys(data).length > 0) {
    await prisma.userProfile.update({
      where: { userId: params.userId },
      data
    });
  }
}

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: authSecret,
  session: {
    strategy: "database"
  },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction
      }
    }
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (user.email) return true;
      return Boolean(account?.providerAccountId);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      if (user.id) {
        await ensureUserProfile({
          userId: user.id,
          name: user.name
        });
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        if (target.origin === baseUrl) {
          return target.toString();
        }
      } catch {
        // no-op
      }

      return baseUrl || resolveAppUrl();
    }
  },
  events: {
    async signIn({ user, account, profile }) {
      const oauthProfile = profile as OAuthProfile | undefined;
      const rawLocale =
        oauthProfile && typeof oauthProfile.locale === "string" ? oauthProfile.locale : null;
      const ALLOWED_LOCALES = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/;
      const locale = rawLocale && ALLOWED_LOCALES.test(rawLocale) ? rawLocale : null;

      if (user.id) {
        await ensureUserProfile({
          userId: user.id,
          name: user.name,
          locale
        });
      }

      const meta = getRequestMetaFromCurrentHeaders();
      await logAuthEvent({
        eventType:
          AUTH_EVENT_TYPES.OAUTH_LOGIN_SUCCESS,
        userId: user.id,
        email: user.email,
        ip: meta.ip,
        userAgent: meta.userAgent
      });
    },
    async signOut(message) {
      const meta = getRequestMetaFromCurrentHeaders();
      const maybeSession =
        message && "session" in message
          ? (message.session as
              | {
                  user?: {
                    id?: string;
                    email?: string;
                  };
                }
              | null
              | undefined)
          : null;

      await logAuthEvent({
        eventType: AUTH_EVENT_TYPES.LOGOUT,
        userId: maybeSession?.user?.id,
        email: maybeSession?.user?.email,
        ip: meta.ip,
        userAgent: meta.userAgent
      });
    }
  },
  logger: {
    error(code, ...message) {
      const meta = getRequestMetaFromCurrentHeaders();
      logAuthEvent({
        eventType: AUTH_EVENT_TYPES.LOGIN_ERROR,
        ip: meta.ip,
        userAgent: meta.userAgent
      }).catch((err) => console.error("[Auth] Failed to log auth event", err));
      console.error("[Auth]", code, ...message);
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export async function getCurrentSession() {
  return auth();
}

export type AuthSession = Awaited<ReturnType<typeof getCurrentSession>>;
