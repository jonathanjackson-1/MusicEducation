import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import Handlebars from 'handlebars';
import { renderMjml } from './mjml-lite';
import { NotificationChannel } from '../types/notification-channel.enum';
import { NotificationTemplateType } from '../types/notification-template.enum';

export interface RenderedEmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface RenderedSmsTemplate {
  body: string;
}

export interface RenderedPushTemplate {
  payload: Record<string, unknown>;
}

export type TemplateContext = Record<string, unknown>;

@Injectable()
export class NotificationTemplateEngine {
  private readonly basePath = path.join(__dirname, 'templates');
  private readonly cache = new Map<string, string>();
  private readonly handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  renderEmail(
    template: NotificationTemplateType,
    locale: string,
    context: TemplateContext,
  ): RenderedEmailTemplate {
    const mjmlTemplate = this.compileTemplate(
      NotificationChannel.EMAIL,
      locale,
      `${template.toLowerCase()}.mjml`,
      context,
    );
    const subjectTemplate = this.compileTemplate(
      NotificationChannel.EMAIL,
      locale,
      `${template.toLowerCase()}.subject.hbs`,
      context,
    );

    const { html } = renderMjml(mjmlTemplate);
    const text = this.toPlainText(html);

    return {
      subject: subjectTemplate.trim(),
      html,
      text,
    };
  }

  renderSms(
    template: NotificationTemplateType,
    locale: string,
    context: TemplateContext,
  ): RenderedSmsTemplate {
    const body = this.compileTemplate(
      NotificationChannel.SMS,
      locale,
      `${template.toLowerCase()}.txt.hbs`,
      context,
    );

    return { body: body.trim() };
  }

  renderPush(
    template: NotificationTemplateType,
    locale: string,
    context: TemplateContext,
  ): RenderedPushTemplate {
    const payloadRaw = this.compileTemplate(
      NotificationChannel.PUSH,
      locale,
      `${template.toLowerCase()}.json.hbs`,
      context,
    );

    try {
      const payload = JSON.parse(payloadRaw);
      return { payload };
    } catch (error) {
      throw new Error(
        `Failed to parse push payload for ${template} (${locale}): ${(error as Error).message}`,
      );
    }
  }

  private compileTemplate(
    channel: NotificationChannel,
    locale: string,
    relativePath: string,
    context: TemplateContext,
  ): string {
    const templatePath = this.resolveTemplatePath(channel, locale, relativePath);
    const raw = this.readTemplate(templatePath);
    const template = this.handlebars.compile(raw);
    return template(context);
  }

  private resolveTemplatePath(
    channel: NotificationChannel,
    locale: string,
    relativePath: string,
  ): string {
    const preferred = path.join(this.basePath, channel.toLowerCase(), locale, relativePath);
    if (fs.existsSync(preferred)) {
      return preferred;
    }

    const fallback = path.join(this.basePath, channel.toLowerCase(), 'en', relativePath);
    if (fs.existsSync(fallback)) {
      return fallback;
    }

    throw new Error(
      `Template not found for channel=${channel} template=${relativePath} locale=${locale}`,
    );
  }

  private readTemplate(filePath: string): string {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath) as string;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    this.cache.set(filePath, content);
    return content;
  }

  private toPlainText(html: string): string {
    return html
      .replace(/<\/?mj-[^>]+>/g, '')
      .replace(/<\/?[a-z][^>]*>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private registerHelpers() {
    this.handlebars.registerHelper('uppercase', (value?: unknown) =>
      String(value ?? '').toUpperCase(),
    );

    this.handlebars.registerHelper('json', (value?: unknown) =>
      JSON.stringify(value ?? {}),
    );
  }
}
