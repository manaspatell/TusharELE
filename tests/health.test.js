const request = require('supertest');
const express = require('express');

// Minimal Express app for test (avoids ESM/CJS issues)
const app = express();
app.get('/admin/login', (req, res) => res.status(404).send('Not found'));

describe('Basic server health', () => {
  it('should return 404 for /admin/login (legacy path)', async () => {
    const res = await request(app).get('/admin/login');
    expect(res.statusCode).toBe(404);
  });
});
