import { Email } from './email.value-object';
import { BusinessRuleViolationException } from '@core/domain/base';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow(BusinessRuleViolationException);
      expect(() => Email.create('')).toThrow('Email is required');
    });

    it('should throw error for whitespace-only email', () => {
      expect(() => Email.create('   ')).toThrow(BusinessRuleViolationException);
      expect(() => Email.create('   ')).toThrow('Email is required');
    });

    it('should throw error for invalid email format', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'test@',
        'test@.com',
        'test.example.com',
        'test@@example.com',
      ];

      invalidEmails.forEach((invalidEmail) => {
        expect(() => Email.create(invalidEmail)).toThrow(BusinessRuleViolationException);
        expect(() => Email.create(invalidEmail)).toThrow('Invalid email format');
      });
    });

    it('should throw error for email exceeding 255 characters', () => {
      const longLocalPart = 'a'.repeat(250);
      const longEmail = `${longLocalPart}@example.com`;
      expect(() => Email.create(longEmail)).toThrow(BusinessRuleViolationException);
      expect(() => Email.create(longEmail)).toThrow('Email must not exceed 255 characters');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'very.common@example.com',
        'disposable.style.email.with+symbol@example.com',
        'user.name+tag+sorting@example.com',
        'x@example.com',
        'example-indeed@strange-example.com',
        'admin@mailserver1.example.org',
        'user@subdomain.example.com',
      ];

      validEmails.forEach((validEmail) => {
        expect(() => Email.create(validEmail)).not.toThrow();
      });
    });
  });

  describe('localPart', () => {
    it('should return the local part of the email', () => {
      const email = Email.create('user@example.com');
      expect(email.localPart).toBe('user');
    });

    it('should return complex local part correctly', () => {
      const email = Email.create('user.name+tag@example.com');
      expect(email.localPart).toBe('user.name+tag');
    });
  });

  describe('domain', () => {
    it('should return the domain part of the email', () => {
      const email = Email.create('user@example.com');
      expect(email.domain).toBe('example.com');
    });

    it('should return subdomain correctly', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.domain).toBe('mail.example.com');
    });
  });

  describe('masked', () => {
    it('should mask email with long local part', () => {
      const email = Email.create('username@example.com');
      expect(email.masked).toBe('u***e@example.com');
    });

    it('should mask email with short local part (2 chars)', () => {
      const email = Email.create('ab@example.com');
      expect(email.masked).toBe('a***@example.com');
    });

    it('should mask email with single char local part', () => {
      const email = Email.create('a@example.com');
      expect(email.masked).toBe('a***@example.com');
    });

    it('should mask email with 3 char local part', () => {
      const email = Email.create('abc@example.com');
      expect(email.masked).toBe('a***c@example.com');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for emails with different cases', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
