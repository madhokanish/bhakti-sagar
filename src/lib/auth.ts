import "server-only";

import crypto from "node:crypto";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import EmailProvider from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

type OAuthProfile = Record<string, unknown>;

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createAppleClientSecret() {
  const directSecret = process.env.APPLE_CLIENT_SECRET?.trim();
  if (directSecret) return directSecret;

  const appleId = process.env.APPLE_ID?.trim();
  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!appleId || !teamId || !keyId || !privateKey) return "";

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
      sub: appleId
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

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database"
  },
  trustHost: true,
  pages: {
    signIn: "/signin"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
    Apple({
      clientId: process.env.APPLE_ID ?? "",
      clientSecret: createAppleClientSecret()
    }),
    ...(process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
      ? [
          EmailProvider({
            server: {
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || "587"),
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            },
            from: process.env.SMTP_FROM || process.env.SMTP_USER
          })
        ]
      : [])
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
    }
  },
  events: {
    async signIn({ user, profile }) {
      if (!user.id) return;

      const oauthProfile = profile as OAuthProfile | undefined;
      const locale =
        oauthProfile && typeof oauthProfile.locale === "string" ? oauthProfile.locale : null;

      await ensureUserProfile({
        userId: user.id,
        name: user.name,
        locale
      });
    }
  }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export async function getCurrentSession() {
  return auth();
}

export type AuthSession = Awaited<ReturnType<typeof getCurrentSession>>;
