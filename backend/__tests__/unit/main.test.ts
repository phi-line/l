import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';

const fetchWithCookies = fetchCookie(fetch);

describe('API Endpoints', () => {
  // Requires server to be running
  const baseURL = 'http://localhost:8000';

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
