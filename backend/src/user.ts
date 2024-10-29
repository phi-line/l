const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name: string): boolean {
  if (name.length === 0) {
    return false;
  }
  return name.length <= MAX_NAME_LENGTH;
}

export function validateEmail(email: string): boolean {
  if (email.length === 0) {
    return false;
  }
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(email);
}
