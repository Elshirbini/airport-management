import { EmailTemplate } from './email-template.interface';

export class WelcomeTemplate implements EmailTemplate {
  constructor(private readonly recipient: string) {}

  get to() {
    return this.recipient;
  }

  subject(): string {
    return '🎉 تم إنشاء حسابك بنجاح – مرحبًا بك في دبّابات';
  }

  html(): string {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; direction: rtl; text-align: right;">
      <h2 style="color: #28a745;">🎉 مرحبًا بك في <strong>دبّابات</strong>!</h2>
      <p style="font-size: 16px; color: #333;">
        تم إنشاء حسابك بنجاح. يمكنك الآن تسجيل الدخول والبدء في استخدام جميع خدماتنا.
      </p>
      <p style="font-size: 14px; color: #555; margin-top: 20px;">
        إذا كان لديك أي استفسار أو تحتاج إلى مساعدة، فريقنا جاهز دائمًا لدعمك.
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 30px;">
        مع تحيات فريق <strong>دبّابات</strong> 💙
      </p>
    </div>
    `;
  }
}
