export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  FLIGHT_DELAY = 'FLIGHT_DELAY',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  WELCOME = 'welcome',
  OTP_CONFIRMATION = 'otp-confirmation',
  RESET_PASSWORD = 'reset-password',
}

export enum NotificationChannel {
  DATABASE = 'DATABASE',
  SOCKET = 'SOCKET',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  GRAPHQL_PUBSUB = 'GRAPHQL_PUBSUB',
}
