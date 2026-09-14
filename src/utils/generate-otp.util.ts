import * as crypto from 'crypto';

export function generateOtp(length: number) {
  const max = 10 ** length;

  const otp = crypto
    .randomInt(0, 10 ** max)
    .toString()
    .padStart(length, '0');
  return otp;
}
