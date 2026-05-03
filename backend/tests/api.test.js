const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
  process.env.JWT_EXPIRE = '1d';
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';

  app = require('../server');
  await new Promise(r => setTimeout(r, 500));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

let adminToken, memberToken, adminId, memberId, projectId, taskId;

describe('Auth Routes', () => {
  test('POST /api/auth/register - registers admin', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    adminToken = res.body.token;
    adminId = res.body.user._id;
  });

  test('POST /api/auth/register - registers member', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Member',
      email: 'member@test.com',
      password: 'password123',
      role: 'member'
    });
    expect(res.statusCode).toBe(201);
    memberToken = res.body.token;
    memberId = res.body.user._id;
  });

  test('POST /api/auth/register - fails with duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'admin@test.com', password: 'password123'
    });
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login - logs in successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com', password: 'password123'
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login - fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com', password: 'wrongpassword'
    });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me - returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });

  test('GET /api/auth/me - fails without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Project Routes', () => {
  test('POST /api/projects - admin creates project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Project', description: 'A test project', color: '#6366f1' });
    expect(res.statusCode).toBe(201);
    expect(res.body.project.name).toBe('Test Project');
    projectId = res.body.project._id;
  });

  test('GET /api/projects - returns user projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.projects.length).toBeGreaterThan(0);
  });

  test('POST /api/projects/:id/members - adds member', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@test.com', role: 'member' });
    expect(res.statusCode).toBe(200);
  });

  test('POST /api/projects/:id/members - fails duplicate member', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@test.com' });
    expect(res.statusCode).toBe(400);
  });
});

describe('Task Routes', () => {
  test('POST /api/tasks - admin creates task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Task',
        description: 'A test task',
        project: projectId,
        priority: 'high',
        status: 'todo',
        assignedTo: memberId
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.task.title).toBe('Test Task');
    taskId = res.body.task._id;
  });

  test('GET /api/tasks - returns tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  test('PUT /api/tasks/:id - member can update status only', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'in_progress' });
    expect(res.statusCode).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
  });

  test('DELETE /api/tasks/:id - member cannot delete', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('DELETE /api/tasks/:id - admin can delete', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});

describe('Dashboard Routes', () => {
  test('GET /api/dashboard/stats - returns stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(res.body.charts).toBeDefined();
  });
});

describe('Input Validation', () => {
  test('Register fails without name', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com', password: '123456' });
    expect(res.statusCode).toBe(400);
  });

  test('Register fails with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'X', email: 'not-email', password: '123456' });
    expect(res.statusCode).toBe(400);
  });

  test('Create task fails without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ project: projectId });
    expect(res.statusCode).toBe(400);
  });
});
