import { EmailTemplate } from './email-template.interface';

export interface BookingConfirmationDetails {
  passengerName: string;
  bookingId: string;
  flightNumber: string;
  airline: string;
  seatNumber: number;
  departureTime: Date;
  arrivalTime: Date;
}

export class BookingConfirmationTemplate implements EmailTemplate {
  constructor(
    private readonly recipient: string,
    private readonly details: BookingConfirmationDetails,
  ) {}

  get to() {
    return this.recipient;
  }

  subject(): string {
    return `Booking Confirmed – Flight ${this.details.flightNumber}`;
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  html(): string {
    const {
      passengerName,
      bookingId,
      flightNumber,
      airline,
      seatNumber,
      departureTime,
      arrivalTime,
    } = this.details;

    const formattedDeparture = this.formatDateTime(departureTime);
    const formattedArrival = this.formatDateTime(arrivalTime);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Booking Confirmation</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f6f8; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-padding { padding: 24px 16px !important; }
      .header-padding { padding: 28px 16px !important; }
      .detail-label, .detail-value { display: block !important; width: 100% !important; text-align: left !important; }
      .detail-value { padding-top: 4px !important; padding-bottom: 12px !important; }
      .seat-badge { font-size: 28px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td class="header-padding" style="background: linear-gradient(135deg, #1a56db 0%, #1e429f 100%); padding: 36px 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.85); letter-spacing: 1px; text-transform: uppercase;">Airport Management</p>
              <h1 style="margin: 0; font-size: 26px; color: #ffffff; font-weight: 700;">Booking Confirmed ✈️</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="content-padding" style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hello <strong>${passengerName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Your flight seat has been successfully booked. Here are your booking details:
              </p>
              <!-- Seat highlight -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center" style="background-color: #eff6ff; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your Seat</p>
                    <p class="seat-badge" style="margin: 0; font-size: 36px; font-weight: 700; color: #1a56db;">${seatNumber}</p>
                  </td>
                </tr>
              </table>
              <!-- Details table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #f9fafb;">
                  <td class="detail-label" style="padding: 14px 16px; font-size: 13px; color: #6b7280; font-weight: 600; width: 40%; border-bottom: 1px solid #e5e7eb;">Booking ID</td>
                  <td class="detail-value" style="padding: 14px 16px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb; word-break: break-all;">${bookingId}</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding: 14px 16px; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Flight Number</td>
                  <td class="detail-value" style="padding: 14px 16px; font-size: 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${flightNumber}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td class="detail-label" style="padding: 14px 16px; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Airline</td>
                  <td class="detail-value" style="padding: 14px 16px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${airline}</td>
                </tr>
                <tr>
                  <td class="detail-label" style="padding: 14px 16px; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Departure</td>
                  <td class="detail-value" style="padding: 14px 16px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${formattedDeparture}</td>
                </tr>
                <tr style="background-color: #f9fafb;">
                  <td class="detail-label" style="padding: 14px 16px; font-size: 13px; color: #6b7280; font-weight: 600;">Arrival</td>
                  <td class="detail-value" style="padding: 14px 16px; font-size: 14px; color: #111827;">${formattedArrival}</td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Please arrive at the airport at least 2 hours before departure. If you need to cancel, you can do so from your account.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This is an automated message from Airport Management. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
