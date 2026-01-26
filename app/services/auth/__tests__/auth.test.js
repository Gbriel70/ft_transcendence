const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Auth Service - Security', () => {
  test('bcrypt should hash passwords correctly', async () => {
    const password = 'senha123';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$')).toBe(true);
    
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);
  });

  test('bcrypt should reject wrong passwords', async () => {
    const password = 'senha123';
    const hash = await bcrypt.hash(password, 10);
    
    const match = await bcrypt.compare('senhaerrada', hash);
    expect(match).toBe(false);
  });

  test('JWT should sign and verify tokens', () => {
    const payload = { id: 1, email: 'test@example.com' };
    const secret = 'test-secret';
    
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeTruthy();
    
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  test('JWT should reject invalid tokens', () => {
    const secret = 'test-secret';
    const fakeToken = 'invalid.token.here';
    
    expect(() => {
      jwt.verify(fakeToken, secret);
    }).toThrow();
  });
});

describe('Auth Service - Validation', () => {
  test('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('valid@email.com')).toBe(true);
    expect(emailRegex.test('invalid.email')).toBe(false);
    expect(emailRegex.test('@invalid.com')).toBe(false);
  });

  test('should validate password length', () => {
    const validatePassword = (pwd) => !!(pwd && pwd.length >= 6);
    
    expect(validatePassword('senha123')).toBe(true);
    expect(validatePassword('123')).toBe(false);
    expect(validatePassword('')).toBe(false);
    expect(validatePassword(null)).toBe(false);
    expect(validatePassword(undefined)).toBe(false);
  });
});