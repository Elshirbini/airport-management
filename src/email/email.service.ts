import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailTemplate } from './templates/email-template.interface';
import { OtpConfirmationTemplate } from './templates/otp-confirmation.template';
import { ResetPasswordTemplate } from './templates/reset-password.template';
import { WelcomeTemplate } from './templates/welcome.template';
import {
  BookingConfirmationDetails,
  BookingConfirmationTemplate,
} from './templates/booking-confirmation.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private async sendEmail(to: string, subject: string, htmlContent: string) {
    try {
      const data = await this.resend.emails.send({
        from: 'Dababat <no-reply@dababat.com>',
        to: [to],
        subject,
        html: htmlContent,
      });

      this.logger.log(`✅ Email sent: ${JSON.stringify(data)}`);
    } catch (error) {
      this.logger.error('❌ Error sending email', error);
    }
  }

  private async sendTemplate(template: EmailTemplate) {
    return this.sendEmail(template.to, template.subject(), template.html());
  }

  async sendOTPConfirmationEmail(to: string, otp: string) {
    const template = new OtpConfirmationTemplate(to, otp);
    await this.sendTemplate(template);
  }

  async sendResetPasswordEmail(to: string, code: string) {
    const template = new ResetPasswordTemplate(to, code);
    await this.sendTemplate(template);
  }

  async sendWelcomeEmail(to: string) {
    const template = new WelcomeTemplate(to);
    await this.sendTemplate(template);
  }

  async sendBookingConfirmationEmail(
    to: string,
    details: BookingConfirmationDetails,
  ) {
    const template = new BookingConfirmationTemplate(to, details);
    await this.sendTemplate(template);
  }
}
