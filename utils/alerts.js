/**
 * utils/alerts.js
 * Instant Admin Notification Webhook Helper.
 * Sends real-time alerts to Discord/Telegram/Slack whenever critical events occur
 * (e.g. withdrawal request, host verification application, large payment).
 */
import { logger } from './logger';

export async function sendAdminAlert({ title, message, fields = [], severity = 'info' }) {
  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL;

  // Log locally always
  logger.info(`[ADMIN_ALERT] ${title} - ${message}`, { fields, severity });

  if (!webhookUrl) {
    // Silent return if no webhook URL is configured
    return false;
  }

  try {
    // Send formatted embed to Discord / Slack compatible webhook
    const payload = {
      embeds: [
        {
          title: `Meova Alert: ${title}`,
          description: message,
          color: severity === 'urgent' ? 0xef4444 : severity === 'warn' ? 0xf59e0b : 0x7c3aed,
          fields: fields.map(f => ({ name: f.name, value: String(f.value), inline: true })),
          timestamp: new Date().toISOString(),
          footer: { text: 'Meova Production Monitor' },
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (err) {
    logger.error('Failed to send webhook alert', err);
    return false;
  }
}
