export const VERIFICATION_CODE_TTL_MINUTES = 30;
export const VERIFICATION_CODE_TTL_MS = VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;

export const codeExpiresAt = (sentAt) => {
  if (!sentAt) {
    return null;
  }

  const sentTime = new Date(sentAt).getTime();

  return Number.isNaN(sentTime) ? null : sentTime + VERIFICATION_CODE_TTL_MS;
};

export const codeStatus = (sentAt, now = Date.now()) => {
  const expiresAt = codeExpiresAt(sentAt);

  if (!expiresAt) {
    return 'unsent';
  }

  return now >= expiresAt ? 'expired' : 'active';
};

export const codeActionLabel = (sentAt, now = Date.now()) => (
  codeStatus(sentAt, now) === 'unsent' ? 'Send Code' : 'Resend Code'
);

export const codeMinutesLeft = (sentAt, now = Date.now()) => {
  const expiresAt = codeExpiresAt(sentAt);

  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((expiresAt - now) / 60000));
};

export const verificationExpiresAt = codeExpiresAt;
export const verificationCodeStatus = codeStatus;
export const verificationActionLabel = codeActionLabel;
export const verificationMinutesLeft = codeMinutesLeft;
