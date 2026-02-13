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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
  const smtpPortRaw = getEnv("SMTP_PORT") || "587";
  const smtpPort = Number(smtpPortRaw);
  const smtpUser = getEnv("SMTP_USER");
  const smtpPass = getEnv("SMTP_PASS");
  const smtpFrom = getEnv("SMTP_FROM") || smtpUser;
  const recipient = getEnv("ONLINE_PUJA_RECIPIENT_EMAIL") || "anishmadhok.in@gmail.com";
  const missingEnv: string[] = [];

  if (!smtpHost) missingEnv.push("SMTP_HOST");
  if (!smtpPortRaw || Number.isNaN(smtpPort)) missingEnv.push("SMTP_PORT");
  if (!smtpUser) missingEnv.push("SMTP_USER");
  if (!smtpPass) missingEnv.push("SMTP_PASS");

  if (missingEnv.length > 0) {
    return NextResponse.json(
      { error: `Email service is not configured. Missing: ${missingEnv.join(", ")}` },
      { status: 503 }
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

  const pujaTitle = body.pujaTitle.trim();
  const pujaSlug = body.pujaSlug.trim();
  const name = body.name.trim();
  const email = body.email.trim();
  const phone = body.phone?.trim() || "Not provided";
  const additionalInfo = body.additionalInfo?.trim() || "Not provided";
  const subject = `Online Puja Interest: ${pujaTitle}`;
  const text = [
    `Puja: ${pujaTitle}`,
    `Slug: ${pujaSlug}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    "",
    "Additional Information:",
    additionalInfo
  ].join("\n");

  const html = `
    <h2>Online Puja Interest</h2>
    <p><strong>Puja:</strong> ${escapeHtml(pujaTitle)}</p>
    <p><strong>Slug:</strong> ${escapeHtml(pujaSlug)}</p>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Additional Information:</strong></p>
    <p>${escapeHtml(additionalInfo).replace(/\n/g, "<br/>")}</p>
  `;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to: recipient,
      replyTo: email,
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
