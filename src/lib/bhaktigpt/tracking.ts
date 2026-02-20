import "server-only";

export function trackServerEvent(eventName: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[BhaktiGPT event]", eventName, payload);
  }
}
