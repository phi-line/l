const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the name of a user.
 * @param {string} name - The name of the user.
 * @returns {boolean} - True if the name is valid, false otherwise.
 */
export function validateName(name: string): boolean {
  if (name.length === 0) {
    return false;
  }
  return name.length <= MAX_NAME_LENGTH;
}

/**
 * Validates the email of a user.
 * @param {string} email - The email of the user.
 * @returns {boolean} - True if the email is valid, false otherwise.
 */
export function validateEmail(email: string): boolean {
  if (email.length === 0) {
    return false;
  }
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(email);
}
