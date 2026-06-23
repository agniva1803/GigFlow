import nodemailer, { Transporter } from 'nodemailer';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
};

/**
 * Sends an email if SMTP env vars are configured; otherwise logs the email
 * to the console. This means the notification feature is fully exercised in
 * local/dev/demo environments without requiring real SMTP credentials, while
 * still being production-ready behind a single env var configuration.
 */
export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const client = getTransporter();
  const from = process.env.SMTP_FROM ?? 'GigFlow <noreply@gigflow.app>';

  if (!client) {
    console.log(`📧 [email:dev-mode] to=${payload.to} subject="${payload.subject}"`);
    return;
  }

  try {
    await client.sendMail({ from, to: payload.to, subject: payload.subject, html: payload.html });
  } catch (error) {
    // Email failures should never break the request that triggered them
    console.error('Failed to send email (non-fatal):', error);
  }
};

export const buildLeadAssignedEmail = (leadName: string, assignerName: string): { subject: string; html: string } => ({
  subject: `New lead assigned: ${leadName}`,
  html: `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2 style="color: #0284c7;">You've been assigned a lead</h2>
      <p><strong>${assignerName}</strong> assigned you the lead <strong>${leadName}</strong> on GigFlow.</p>
      <p>Log in to your dashboard to follow up.</p>
    </div>
  `,
});

export const buildStatusChangedEmail = (
  leadName: string,
  fromStatus: string,
  toStatus: string
): { subject: string; html: string } => ({
  subject: `Lead status updated: ${leadName} → ${toStatus}`,
  html: `
    <div style="font-family: sans-serif; max-width: 480px;">
      <h2 style="color: #0284c7;">Lead status changed</h2>
      <p><strong>${leadName}</strong> moved from <strong>${fromStatus}</strong> to <strong>${toStatus}</strong>.</p>
    </div>
  `,
});
