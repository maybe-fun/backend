import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import * as path from 'path';
import { CreateEmailOptions, Resend } from 'resend';
import { getResourcesDir } from 'src/common/utils/path.utils';

@Injectable()
export class EmailService {
  private readonly resendClient: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resendClient = new Resend(this.config.get('resend.apiKey'));
  }

  async sendTemplate<T>(
    template: string,
    data: T,
    options: {
      template?: Record<string, any>;
      mail: {
        tags?: string[];
        attachments?: { type: string; name: string; content: string }[];
        recipients: { email: string; name?: string }[];
        subject: string;
      };
    },
  ) {
    const templatePath = getResourcesDir(
      path.join('templates/email', `${template}_en-us.ejs`),
    );

    const html = await ejs.renderFile(templatePath, data, options?.template);

    const from = this.config.get<string>('mail.from');
    if (!from) {
      throw new Error('MAIL_FROM is not configured');
    }

    const email: CreateEmailOptions = {
      to: options?.mail?.recipients.map((r) => r.email),
      from,
      subject: options?.mail.subject,
      html,
    };

    return this.resendClient.emails.send(email);
  }
}
