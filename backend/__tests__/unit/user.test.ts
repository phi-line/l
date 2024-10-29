import { describe, it, expect } from 'vitest';
import { validateName, validateEmail } from '../../src/user.js';

describe('User Validation', () => {
  describe('validateName', () => {
    it('should return true for valid names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('Jane Doe')).toBe(true);
      expect(validateName('A'.repeat(50))).toBe(true); // Edge case: exactly 50 characters
    });

    it('should return false for invalid names', () => {
      expect(validateName('')).toBe(false); // Empty name
      expect(validateName('A'.repeat(51))).toBe(false); // Edge case: more than 50 characters
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag+sorting@example.com')).toBe(true);
      expect(validateEmail('x@example.com')).toBe(true); // Edge case: minimal length
      expect(
        validateEmail('A'.repeat(100 - '@example.com'.length) + '@example.com'),
      ).toBe(true); // Edge case: exactly 100 characters
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('')).toBe(false); // Empty email
      expect(validateEmail('plainaddress')).toBe(false); // Missing @
      expect(validateEmail('@missingusername.com')).toBe(false); // Missing username
      expect(validateEmail('username@.com')).toBe(false); // Missing domain name
      expect(validateEmail('username@com')).toBe(false); // Missing dot in domain
      expect(
        validateEmail('A'.repeat(101 - '@example.com'.length) + '@example.com'),
      ).toBe(false); // Edge case: more than 100 characters
    });
  });
});
