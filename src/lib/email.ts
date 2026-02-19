import "server-only";

type TrialReminderPayload = {
  email: string;
  trialEnd: Date;
  renewalPrice: string;
  manageUrl: string;
};

function getAppUrl() {
  return process.env.APP_URL?.trim() || "http://localhost:3000";
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "Bhakti Sagar <noreply@bhakti-sagar.com>";
}

export async function sendTrialReminderEmail(payload: TrialReminderPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  const renewalDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(payload.trialEnd);

  const body = {
    from: getFromAddress(),
    to: [payload.email],
    subject: "Your Bhakti Sagar membership billing reminder",
    html: `
      <p>Namaste,</p>
      <p>Your Bhakti Sagar membership renews on <strong>${renewalDate}</strong>.</p>
      <p>Renewal amount is <strong>${payload.renewalPrice} per month</strong>.</p>
      <p>You can cancel anytime from your billing portal:</p>
      <p><a href="${payload.manageUrl}">${payload.manageUrl}</a></p>
      <p>With gratitude,<br/>Bhakti Sagar</p>
    `
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { sent: false, reason: text || "Resend API failed." };
  }

  return { sent: true, reason: "" };
}

export function getManageSubscriptionUrl() {
  return `${getAppUrl()}/manage-subscription`;
}
