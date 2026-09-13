import { EmailTemplate } from './email-template.interface';

export class ResetPasswordTemplate implements EmailTemplate {
  constructor(
    private readonly recipient: string,
    private readonly code: string,
  ) {}

  get to() {
    return this.recipient;
  }

  subject(): string {
    return '🔑 إعادة تعيين كلمة المرور – دبّابات';
  }

  html(): string {
    return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; direction: rtl; text-align: right; background-color: #f4f4f4;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <h2 style="color: #333;">🔐 إعادة تعيين كلمة المرور</h2>
        <p style="font-size: 16px; color: #555;">
          لقد طلبت إعادة تعيين كلمة المرور لحسابك على <strong>دبّابات</strong>. استخدم الرمز التالي لإكمال العملية:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #007bff;">${this.code}</span>
        </div>
        <p style="font-size: 14px; color: #999;">
          ⚠️ هذا الرمز صالح لمدة <strong>10 دقائق فقط</strong>. إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد بأمان.
        </p>
        <p style="font-size: 14px; color: #555; margin-top: 20px;">
          مع تحيات فريق <strong>دبّابات</strong> 💙
        </p>
      </div>
    </div>
    `;
  }
}
