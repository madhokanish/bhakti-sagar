import "server-only";

import { prisma } from "@/lib/prisma";

export const AUTH_EVENT_TYPES = {
  EMAIL_MAGICLINK_SENT: "EMAIL_MAGICLINK_SENT",
  EMAIL_MAGICLINK_USED: "EMAIL_MAGICLINK_USED",
  OAUTH_LOGIN_SUCCESS: "OAUTH_LOGIN_SUCCESS",
  LOGIN_ERROR: "LOGIN_ERROR",
  LOGOUT: "LOGOUT"
} as const;

export type AuthEventType = (typeof AUTH_EVENT_TYPES)[keyof typeof AUTH_EVENT_TYPES];

export async function logAuthEvent(input: {
  eventType: AuthEventType;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.authEvent.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        email: input.email?.trim().toLowerCase() || null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null
      }
    });
  } catch (error) {
    console.error("[Auth] Failed to persist auth event", {
      eventType: input.eventType,
      error
    });
  }
}
