import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import app from '../src/app.js';

test('GET /api/v1/health returns 200 and JSON body', async () => {
  const res = await supertest(app).get('/api/v1/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(typeof res.body.message === 'string');
});
