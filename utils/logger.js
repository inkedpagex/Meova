/**
 * utils/logger.js
 * Production Structured JSON Logger.
 * Outputs parseable JSON objects for Datadog, Cloud Logging, Logtail, or terminal.
 */

function formatLog(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  return JSON.stringify({
    timestamp,
    level,
    message,
    ...metadata,
    env: process.env.NODE_ENV || 'development',
  });
}

export const logger = {
  info: (message, metadata = {}) => {
    console.log(formatLog('INFO', message, metadata));
  },

  warn: (message, metadata = {}) => {
    console.warn(formatLog('WARN', message, metadata));
  },

  error: (message, error = null, metadata = {}) => {
    const errorDetails = error
      ? {
          errorMessage: error.message || String(error),
          stack: error.stack || null,
        }
      : {};

    console.error(formatLog('ERROR', message, { ...metadata, ...errorDetails }));
  },

  audit: (action, userId, details = {}) => {
    console.log(formatLog('AUDIT', `AUDIT_LOG: ${action}`, { userId, action, ...details }));
  },
};
