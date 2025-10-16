import { ConsoleLogger } from '@nestjs/common';

const SENSITIVE_KEYS = new Set(['email', 'firstName', 'lastName', 'phone', 'token', 'password']);
const EMAIL_PATTERN = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;

function redactStructured(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactStructured(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => {
        if (SENSITIVE_KEYS.has(key)) {
          return [key, '[REDACTED]'];
        }
        return [key, redactStructured(val)];
      }),
    );
  }

  if (typeof value === 'string') {
    return value.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
  }

  return value;
}

export class RedactingLogger extends ConsoleLogger {
  private scrub(message: unknown): string {
    if (typeof message === 'string') {
      return message.replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
    }

    try {
      return JSON.stringify(redactStructured(message));
    } catch (error) {
      return String(message);
    }
  }

  log(message: any, context?: string) {
    super.log(this.scrub(message), context);
  }

  error(message: any, stack?: string, context?: string) {
    super.error(this.scrub(message), stack, context);
  }

  warn(message: any, context?: string) {
    super.warn(this.scrub(message), context);
  }

  debug(message: any, context?: string) {
    super.debug(this.scrub(message), context);
  }

  verbose(message: any, context?: string) {
    super.verbose(this.scrub(message), context);
  }
}
