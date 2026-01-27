import { Password } from './password.value-object';
import { BusinessRuleViolationException } from '@core/domain/base';

describe('Password Value Object', () => {
  const validPassword = 'TestP@ss123';

  describe('create (async)', () => {
    it('should create a password with valid input', async () => {
      const password = await Password.create(validPassword);
      expect(password).toBeDefined();
      expect(password.hashedValue).toBeDefined();
      expect(password.hashedValue).not.toBe(validPassword);
    });

    it('should create different hashes for same password', async () => {
      const password1 = await Password.create(validPassword);
      const password2 = await Password.create(validPassword);
      expect(password1.hashedValue).not.toBe(password2.hashedValue);
    });

    it('should throw error for empty password', async () => {
      await expect(Password.create('')).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create('')).rejects.toThrow('Password is required');
    });

    it('should throw error for password shorter than 8 characters', async () => {
      await expect(Password.create('Short1!')).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create('Short1!')).rejects.toThrow(
        'Password must be at least 8 characters',
      );
    });

    it('should throw error for password longer than 128 characters', async () => {
      const longPassword = `${'A'.repeat(100)}a1!${'A'.repeat(30)}`;
      await expect(Password.create(longPassword)).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create(longPassword)).rejects.toThrow(
        'Password must not exceed 128 characters',
      );
    });

    it('should throw error for password without uppercase letter', async () => {
      await expect(Password.create('testpass123!')).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create('testpass123!')).rejects.toThrow(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should throw error for password without lowercase letter', async () => {
      await expect(Password.create('TESTPASS123!')).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create('TESTPASS123!')).rejects.toThrow(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should throw error for password without number', async () => {
      await expect(Password.create('TestPass!!')).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create('TestPass!!')).rejects.toThrow(
        'Password must contain at least one number',
      );
    });

    it('should throw error for password without special character', async () => {
      await expect(Password.create('TestPass123')).rejects.toThrow(BusinessRuleViolationException);
      await expect(Password.create('TestPass123')).rejects.toThrow(
        'Password must contain at least one special character',
      );
    });

    it('should accept various special characters', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
      for (const char of specialChars) {
        const pwd = `TestPass1${char}`;
        await expect(Password.create(pwd)).resolves.toBeDefined();
      }
    });
  });

  describe('createSync', () => {
    it('should create a password synchronously', () => {
      const password = Password.createSync(validPassword);
      expect(password).toBeDefined();
      expect(password.hashedValue).toBeDefined();
    });

    it('should throw error for invalid password', () => {
      expect(() => Password.createSync('short')).toThrow(BusinessRuleViolationException);
    });
  });

  describe('fromHash', () => {
    it('should create a password from existing hash', async () => {
      const original = await Password.create(validPassword);
      const reconstituted = Password.fromHash(original.hashedValue);
      expect(reconstituted.hashedValue).toBe(original.hashedValue);
    });

    it('should throw error for empty hash', () => {
      expect(() => Password.fromHash('')).toThrow(BusinessRuleViolationException);
      expect(() => Password.fromHash('')).toThrow('Hashed password is required');
    });
  });

  describe('verifyAsync', () => {
    it('should return true for correct password', async () => {
      const password = await Password.create(validPassword);
      const isValid = await password.verifyAsync(validPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = await Password.create(validPassword);
      const isValid = await password.verifyAsync('WrongPass123!');
      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = await Password.create(validPassword);
      const isValid = await password.verifyAsync('');
      expect(isValid).toBe(false);
    });
  });

  describe('verify (sync)', () => {
    it('should return true for correct password', () => {
      const password = Password.createSync(validPassword);
      const isValid = password.verify(validPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const password = Password.createSync(validPassword);
      const isValid = password.verify('WrongPass123!');
      expect(isValid).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same hash', async () => {
      const password = await Password.create(validPassword);
      const same = Password.fromHash(password.hashedValue);
      expect(password.equals(same)).toBe(true);
    });

    it('should return false for different hashes', async () => {
      const password1 = await Password.create(validPassword);
      const password2 = await Password.create(validPassword);
      expect(password1.equals(password2)).toBe(false);
    });
  });
});
