import request from 'supertest';
import app from '../app';
import User from '../models/User';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a JWT', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password1',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('hashes the password — it is never stored in plaintext', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'hash-check@example.com',
        password: 'password1',
      });

      const user = await User.findOne({ email: 'hash-check@example.com' }).select('+password');
      expect(user?.password).not.toBe('password1');
      expect(user?.password.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('rejects duplicate email registration', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'First',
        email: 'dupe@example.com',
        password: 'password1',
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Second',
        email: 'dupe@example.com',
        password: 'password2',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects a password without a letter and a number', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak Password',
        email: 'weak@example.com',
        password: 'aaaaaaaa',
      });

      expect(res.status).toBe(400);
    });

    it('rejects an invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad Email',
        email: 'not-an-email',
        password: 'password1',
      });

      expect(res.status).toBe(400);
    });

    it('always creates a "sales" account on public registration, even if the request body claims role=admin', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Privilege Escalation Attempt',
        email: 'escalation@example.com',
        password: 'password1',
        role: 'admin', // attacker-controlled field — must be ignored
      });

      expect(res.body.data.user.role).toBe('sales');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'correctpass1',
      });
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'correctpass1',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects an incorrect password without revealing whether the email exists', async () => {
      const wrongPassword = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrongpassword',
      });
      const unknownEmail = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'wrongpassword',
      });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      // Both error messages must be identical — distinguishing them leaks
      // which emails are registered (a user-enumeration vulnerability).
      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects requests with no token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects requests with a malformed token', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
      expect(res.status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const register = await request(app).post('/api/auth/register').send({
        name: 'Me Endpoint',
        email: 'me@example.com',
        password: 'password1',
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${register.body.data.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('me@example.com');
    });
  });
});
