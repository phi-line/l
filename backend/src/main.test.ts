import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import { exec, ChildProcess } from 'child_process';
import path from 'path';

const fetchWithCookies = fetchCookie(fetch);

describe('API Endpoints', () => {
  let serverProcess: ChildProcess;
  const baseURL = 'http://localhost:8000';

  beforeAll(async () => {
    serverProcess = exec(
      'node ' + path.join(__dirname, 'main.js'),
      (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(() => {
    serverProcess.kill();
  });

  const request = async (url: string, options: any = {}) => {
    const response = await fetchWithCookies(`${baseURL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.text();
    try {
      return { status: response.status, data: JSON.parse(data) };
    } catch {
      return { status: response.status, data };
    }
  };

  it('should register a new user', async () => {
    const userData = {
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
    };

    const response = await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('User registered and logged in successfully');
  });

  it('should login with the same user credentials', async () => {
    const response = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('User logged in successfully');
  });

  it('should access the profile endpoint using the session cookie', async () => {
    const response = await request('/v1/profile');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      email: 'testuser@example.com',
      name: 'Test User',
    });
  });
});
