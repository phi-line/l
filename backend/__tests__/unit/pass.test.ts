import { describe, it, expect } from 'vitest';
import { generateHashPassword, verifyPassword } from '../../src/pass';

describe('Password Hashing and Verification', () => {
  it('should generate a hashed password', async () => {
    const password = 'password123';
    const persistedPassword = await generateHashPassword(password);

    expect(persistedPassword).toHaveProperty('salt');
    expect(persistedPassword).toHaveProperty('hash');
    expect(persistedPassword).toHaveProperty('iterations');
    expect(persistedPassword.iterations).toBe(10000);
  });

  it('should verify the correct password', async () => {
    const password = 'password123';
    const persistedPassword = await generateHashPassword(password);
    const isValid = await verifyPassword(persistedPassword, password);

    expect(isValid).toBe(true);
  });

  it('should not verify an incorrect password', async () => {
    const password = 'password123';
    const wrongPassword = 'wrongpassword';
    const persistedPassword = await generateHashPassword(password);
    const isValid = await verifyPassword(persistedPassword, wrongPassword);

    expect(isValid).toBe(false);
  });
});
