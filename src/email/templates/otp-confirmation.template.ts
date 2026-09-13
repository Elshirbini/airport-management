import { EmailTemplate } from './email-template.interface';

export class OtpConfirmationTemplate implements EmailTemplate {
  constructor(
    private readonly recipient: string,
    private readonly otp: string,
  ) {}

  get to() {
    return this.recipient;
  }

  subject(): string {
    return 'تأكيد حسابك في دبّابات';
  }

  html(): string {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>تأكيد الحساب</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f6f6f6; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6; padding:20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; padding:32px;">
            
            <!-- Header -->
            <tr>
              <td style="text-align:right;">
                <h2 style="margin:0; color:#222;">مرحبًا بك في دبّابات</h2>
                <p style="margin:8px 0 0; color:#666; font-size:14px;">
                  يسعدنا انضمامك إلينا
                </p>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding-top:24px; color:#444; font-size:15px; line-height:1.7;">
                <p>
                  لإكمال عملية إنشاء حسابك، يرجى استخدام رمز التحقق التالي:
                </p>

                <div style="text-align:center; margin:24px 0;">
                  <span style="
                    display:inline-block;
                    padding:12px 24px;
                    font-size:24px;
                    letter-spacing:6px;
                    font-weight:bold;
                    color:#1a73e8;
                    background-color:#f1f5ff;
                    border-radius:6px;
                  ">
                    ${this.otp}
                  </span>
                </div>

                <p style="font-size:14px; color:#666;">
                  هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
                  إذا لم تقم بطلب إنشاء حساب، يمكنك تجاهل هذه الرسالة بأمان.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding-top:32px; border-top:1px solid #eee; font-size:13px; color:#888;">
                <p style="margin:0;">
                  مع تحيات فريق <strong>دبّابات</strong>
                </p>
                <p style="margin:6px 0 0;">
                  هذا البريد الإلكتروني تم إرساله تلقائيًا، يرجى عدم الرد عليه.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;
  }
}
