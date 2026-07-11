import crypto from "crypto";

const SLACK_API = "https://slack.com/api";

// Verifies a Slack request signature (v0 scheme). Pass the raw, unparsed body.
export function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null
): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !timestamp || !signature) return false;

  // Reject anything older than 5 minutes to blunt replay attacks.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 60 * 5) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const expected =
    "v0=" + crypto.createHmac("sha256", secret).update(base).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function slackFetch(method: string, body: unknown): Promise<any> {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Opens (or reuses) a DM channel with the user and returns its channel id.
export async function openDm(userId: string): Promise<string | null> {
  const data = await slackFetch("conversations.open", { users: userId });
  return data?.ok ? data.channel?.id ?? null : null;
}

export async function postMessage(channel: string, text: string): Promise<void> {
  await slackFetch("chat.postMessage", { channel, text, unfurl_links: false });
}

// Sends a direct message to a single user.
export async function dmUser(userId: string, text: string): Promise<void> {
  const channel = await openDm(userId);
  if (channel) await postMessage(channel, text);
}
