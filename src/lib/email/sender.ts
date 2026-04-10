import { Resend } from 'resend';
import { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key');

const FROM_EMAIL = 'notifications@only-hunts.com'; 

interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  react?: ReactElement; // CHANGED: Resend strictly prefers ReactElement over ReactNode
}

export async function sendPlatformEmail({ to, subject, html, text, react }: EmailPayload) {
  // Safety check
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('dummy')) {
    console.warn(`[DEV MODE] Email to ${to} bypassed. Missing valid API Key.`);
    return { success: true, bypassed: true };
  }

  try {
    // Dynamically build the payload to satisfy Resend's strict type checker
    const payload: any = {
      from: `Only-Hunts <${FROM_EMAIL}>`,
      to: [to],
      subject: subject,
    };

    if (react) payload.react = react;
    if (html) payload.html = html;
    if (text) payload.text = text;

    const data = await resend.emails.send(payload);

    return { success: true, data };
  } catch (error) {
    console.error('Resend Error:', error);
    return { success: false, error };
  }
}