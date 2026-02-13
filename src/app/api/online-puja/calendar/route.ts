import { NextResponse } from "next/server";
import { getOnlinePujaBySlug, getNextPujaOccurrence } from "@/lib/onlinePuja";

function formatICSDateUTC(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const orderId = searchParams.get("orderId") || "";

  if (!slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const puja = getOnlinePujaBySlug(slug);
  if (!puja || !puja.isActive) {
    return NextResponse.json({ error: "Seva not found." }, { status: 404 });
  }

  const start = getNextPujaOccurrence({
    weeklyDay: puja.weeklyDay,
    startTime: puja.startTime,
    timeZone: puja.timezone
  });
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const now = new Date();
  const uidSeed = `${slug}-${orderId || start.getTime()}`;

  const summary = escapeIcsText(`Bhakti Sagar Online Puja - ${puja.title}`);
  const description = escapeIcsText(
    `Temple: ${puja.temple.name}, ${puja.temple.city}. Booking ID: ${orderId || "N/A"}.`
  );
  const location = escapeIcsText(`${puja.temple.name}, ${puja.temple.city}, ${puja.temple.state}`);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bhakti Sagar//Online Puja//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uidSeed}@bhakti-sagar.com`,
    `DTSTAMP:${formatICSDateUTC(now)}`,
    `DTSTART:${formatICSDateUTC(start)}`,
    `DTEND:${formatICSDateUTC(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  return new NextResponse(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${slug}-seva.ics\"`,
      "Cache-Control": "no-store"
    }
  });
}
