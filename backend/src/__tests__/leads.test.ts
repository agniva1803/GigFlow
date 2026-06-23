import request from 'supertest';
import app from '../app';
import User from '../models/User';
import { generateToken } from '../utils/jwt';

interface AuthedUser {
  token: string;
  userId: string;
}

/**
 * Public registration always creates a "sales" user (see auth.controller.ts —
 * accepting a client-supplied role would be a privilege-escalation bug), so
 * admin test users are created directly via the model and issued a token
 * with the same helper the controller uses.
 */
const registerAndLogin = async (overrides: { email: string; role?: 'admin' | 'sales' }): Promise<AuthedUser> => {
  if (overrides.role === 'admin') {
    const user = await User.create({
      name: 'Test Admin',
      email: overrides.email,
      password: 'password1',
      role: 'admin',
    });
    return { token: generateToken(user._id.toString(), 'admin'), userId: user._id.toString() };
  }

  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: overrides.email,
    password: 'password1',
  });
  return { token: res.body.data.token as string, userId: res.body.data.user.id as string };
};

const createLead = (token: string, overrides: Partial<Record<string, unknown>> = {}) =>
  request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test Lead',
      email: 'lead@example.com',
      source: 'Website',
      ...overrides,
    });

describe('Leads API', () => {
  describe('Role-based access control', () => {
    it('a sales rep cannot see leads created by another sales rep', async () => {
      const repA = await registerAndLogin({ email: 'repA@example.com', role: 'sales' });
      const repB = await registerAndLogin({ email: 'repB@example.com', role: 'sales' });

      await createLead(repA.token, { name: 'Rep A Lead' });
      await createLead(repB.token, { name: 'Rep B Lead' });

      const repAView = await request(app).get('/api/leads').set('Authorization', `Bearer ${repA.token}`);

      expect(repAView.body.data).toHaveLength(1);
      expect(repAView.body.data[0].name).toBe('Rep A Lead');
    });

    it('an admin sees leads created by every sales rep', async () => {
      const admin = await registerAndLogin({ email: 'admin-rbac@example.com', role: 'admin' });
      const rep = await registerAndLogin({ email: 'rep-rbac@example.com', role: 'sales' });

      await createLead(rep.token, { name: 'Reps Lead' });
      await createLead(admin.token, { name: 'Admins Lead' });

      const adminView = await request(app).get('/api/leads').set('Authorization', `Bearer ${admin.token}`);

      expect(adminView.body.data).toHaveLength(2);
    });

    it('a sales rep gets 403 when updating a lead they do not own', async () => {
      const owner = await registerAndLogin({ email: 'owner@example.com', role: 'sales' });
      const intruder = await registerAndLogin({ email: 'intruder@example.com', role: 'sales' });

      const created = await createLead(owner.token);
      const leadId = created.body.data._id;

      const res = await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${intruder.token}`)
        .send({ status: 'Lost' });

      expect(res.status).toBe(403);
    });

    it('a sales rep gets 403 when deleting a lead they do not own', async () => {
      const owner = await registerAndLogin({ email: 'owner2@example.com', role: 'sales' });
      const intruder = await registerAndLogin({ email: 'intruder2@example.com', role: 'sales' });

      const created = await createLead(owner.token);
      const leadId = created.body.data._id;

      const res = await request(app)
        .delete(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${intruder.token}`);

      expect(res.status).toBe(403);
    });

    it('rejects all lead routes without a valid token', async () => {
      const res = await request(app).get('/api/leads');
      expect(res.status).toBe(401);
    });
  });

  describe('CRUD + filtering', () => {
    it('creates a lead with default status "New"', async () => {
      const user = await registerAndLogin({ email: 'create-default@example.com' });
      const res = await createLead(user.token);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('New');
    });

    it('rejects a lead with an invalid source', async () => {
      const user = await registerAndLogin({ email: 'bad-source@example.com' });
      const res = await createLead(user.token, { source: 'Carrier Pigeon' });

      expect(res.status).toBe(400);
    });

    it('filters leads by status', async () => {
      const user = await registerAndLogin({ email: 'filter-status@example.com' });
      await createLead(user.token, { name: 'New Lead' });
      const qualified = await createLead(user.token, { name: 'Qualified Lead' });

      await request(app)
        .put(`/api/leads/${qualified.body.data._id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ status: 'Qualified' });

      const res = await request(app)
        .get('/api/leads?status=Qualified')
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Qualified Lead');
    });

    it('searches leads by name or email (case-insensitive)', async () => {
      const user = await registerAndLogin({ email: 'search@example.com' });
      await createLead(user.token, { name: 'Priya Sharma', email: 'priya@example.com' });
      await createLead(user.token, { name: 'Rahul Mehta', email: 'rahul@example.com' });

      const res = await request(app)
        .get('/api/leads?search=priya')
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Priya Sharma');
    });

    it('paginates results and reports correct metadata', async () => {
      const user = await registerAndLogin({ email: 'paginate@example.com' });
      for (let i = 0; i < 15; i++) {
        await createLead(user.token, { name: `Lead ${i}`, email: `lead${i}@example.com` });
      }

      const res = await request(app)
        .get('/api/leads?page=2&limit=10')
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.body.data).toHaveLength(5);
      expect(res.body.pagination.total).toBe(15);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.hasNext).toBe(false);
      expect(res.body.pagination.hasPrev).toBe(true);
    });
  });

  describe('Activity audit trail', () => {
    it('logs a "created" entry when a lead is created', async () => {
      const user = await registerAndLogin({ email: 'activity-create@example.com' });
      const created = await createLead(user.token);

      const res = await request(app)
        .get(`/api/leads/${created.body.data._id}/activity`)
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe('created');
    });

    it('logs a "status_changed" entry with from/to values on update', async () => {
      const user = await registerAndLogin({ email: 'activity-status@example.com' });
      const created = await createLead(user.token);
      const leadId = created.body.data._id;

      await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ status: 'Contacted' });

      const res = await request(app)
        .get(`/api/leads/${leadId}/activity`)
        .set('Authorization', `Bearer ${user.token}`);

      const statusEntry = res.body.data.find((entry: { action: string }) => entry.action === 'status_changed');
      expect(statusEntry).toBeDefined();
      expect(statusEntry.fromValue).toBe('New');
      expect(statusEntry.toValue).toBe('Contacted');
    });

    it('does not log an activity entry when an update changes nothing', async () => {
      const user = await registerAndLogin({ email: 'activity-noop@example.com' });
      const created = await createLead(user.token);
      const leadId = created.body.data._id;

      await request(app)
        .put(`/api/leads/${leadId}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ status: 'New' }); // same value it already had

      const res = await request(app)
        .get(`/api/leads/${leadId}/activity`)
        .set('Authorization', `Bearer ${user.token}`);

      expect(res.body.data).toHaveLength(1); // only the original "created" entry
    });
  });

  describe('Bulk import', () => {
    it('imports valid rows and reports per-row errors for invalid ones', async () => {
      const user = await registerAndLogin({ email: 'bulk-import@example.com' });

      const res = await request(app)
        .post('/api/leads/bulk-import')
        .set('Authorization', `Bearer ${user.token}`)
        .send({
          rows: [
            { name: 'Valid Lead', email: 'valid@example.com', source: 'Website' },
            { name: 'X', email: 'bad-name@example.com', source: 'Website' }, // name too short
            { name: 'Bad Email', email: 'not-an-email', source: 'Website' },
            { name: 'Bad Source', email: 'badsource@example.com', source: 'Carrier Pigeon' },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.createdCount).toBe(1);
      expect(res.body.data.errorCount).toBe(3);
    });

    it('rejects an empty rows array', async () => {
      const user = await registerAndLogin({ email: 'bulk-empty@example.com' });

      const res = await request(app)
        .post('/api/leads/bulk-import')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ rows: [] });

      expect(res.status).toBe(400);
    });
  });

  describe('Dashboard stats', () => {
    it('returns correct counts by status and source, scoped to the requesting user', async () => {
      const repA = await registerAndLogin({ email: 'stats-repA@example.com', role: 'sales' });
      const repB = await registerAndLogin({ email: 'stats-repB@example.com', role: 'sales' });

      await createLead(repA.token, { name: 'A1', email: 'a1@example.com', source: 'Website' });
      await createLead(repA.token, { name: 'A2', email: 'a2@example.com', source: 'Instagram' });
      await createLead(repB.token, { name: 'B1', email: 'b1@example.com', source: 'Referral' });

      const res = await request(app).get('/api/leads/stats').set('Authorization', `Bearer ${repA.token}`);

      expect(res.body.data.total).toBe(2); // only repA's leads
      expect(res.body.data.bySource.Website).toBe(1);
      expect(res.body.data.bySource.Instagram).toBe(1);
      expect(res.body.data.bySource.Referral).toBe(0);
    });
  });
});
