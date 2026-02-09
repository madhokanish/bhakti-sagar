import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type Payload = {
  pujaSlug: string;
  pujaTitle: string;
  name: string;
  email: string;
  phone?: string;
  additionalInfo?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;

  if (!body?.name?.trim() || !body?.email?.trim() || !body?.pujaSlug || !body?.pujaTitle) {
    return NextResponse.json({ error: "Please fill required fields." }, { status: 400 });
  }

  if (!isValidEmail(body.email.trim())) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const smtpHost = getEnv("SMTP_HOST");
  const smtpPort = Number(getEnv("SMTP_PORT") || "587");
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const smtpFrom = getEnv("SMTP_FROM") || "Bhakti Sagar <no-reply@bhakti-sagar.com>";
  const recipient = getEnv("ONLINE_PUJA_RECIPIENT_EMAIL") || "anishmadhok.in@gmail.com";

  if (!smtpHost || !smtpUser || !smtpPass || Number.isNaN(smtpPort)) {
    return NextResponse.json(
      { error: "Email service is not configured. Please contact support." },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  const subject = `Online Puja Interest: ${body.pujaTitle}`;
  const text = [
    `Puja: ${body.pujaTitle}`,
    `Slug: ${body.pujaSlug}`,
    `Name: ${body.name.trim()}`,
    `Email: ${body.email.trim()}`,
    `Phone: ${body.phone?.trim() || "Not provided"}`,
    "",
    "Additional Information:",
    body.additionalInfo?.trim() || "Not provided"
  ].join("\n");

  const html = `
    <h2>Online Puja Interest</h2>
    <p><strong>Puja:</strong> ${body.pujaTitle}</p>
    <p><strong>Slug:</strong> ${body.pujaSlug}</p>
    <p><strong>Name:</strong> ${body.name.trim()}</p>
    <p><strong>Email:</strong> ${body.email.trim()}</p>
    <p><strong>Phone:</strong> ${body.phone?.trim() || "Not provided"}</p>
    <p><strong>Additional Information:</strong></p>
    <p>${(body.additionalInfo?.trim() || "Not provided").replace(/\n/g, "<br/>")}</p>
  `;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: recipient,
      replyTo: body.email.trim(),
      subject,
      text,
      html
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

