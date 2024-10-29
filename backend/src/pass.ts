// Based on https://stackoverflow.com/a/45652825

import * as crypto from 'crypto';

const PASSWORD_LENGTH = 256;
const SALT_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha256';
const BYTE_TO_STRING_ENCODING = 'base64';

/**
 * The information about the password that is stored in the database
 */
export interface PersistedPassword {
  salt: string;
  hash: string;
  iterations: number;
}

/**
 * Generates a PersistedPassword given the password provided by the user.
 * This should be called when creating a user or redefining the password
 */
export async function generateHashPassword(
  password: string,
): Promise<PersistedPassword> {
  const salt = crypto
    .randomBytes(SALT_LENGTH)
    .toString(BYTE_TO_STRING_ENCODING);
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      PASSWORD_LENGTH,
      DIGEST,
      (error, derivedKey) => {
        if (error) {
          return reject(error);
        }
        resolve(derivedKey);
      },
    );
  });

  return {
    salt,
    hash: hash.toString(BYTE_TO_STRING_ENCODING),
    iterations: ITERATIONS,
  };
}

/**
 * Verifies the attempted password against the password information saved in
 * the database. This should be called when the user tries to log in.
 */
export async function verifyPassword(
  persistedPassword: PersistedPassword,
  passwordAttempt: string,
): Promise<boolean> {
  const hash = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(
      passwordAttempt,
      persistedPassword.salt,
      persistedPassword.iterations,
      PASSWORD_LENGTH,
      DIGEST,
      (error, derivedKey) => {
        if (error) {
          return reject(error);
        }
        resolve(derivedKey);
      },
    );
  });

  return persistedPassword.hash === hash.toString(BYTE_TO_STRING_ENCODING);
}
