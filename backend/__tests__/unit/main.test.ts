import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';

const fetchWithCookies = fetchCookie(fetch);

// Utility function to generate random strings
const generateRandomString = (length: number) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length);

// Utility function to generate random emails
const generateRandomEmail = () => `user${generateRandomString(5)}@example.com`;

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
      name: `Test User ${generateRandomString(5)}`,
      email: generateRandomEmail(),
      password: generateRandomString(10),
    };

    const response = await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('User registered and logged in successfully');
  });

  it('should login with the same user credentials', async () => {
    const email = generateRandomEmail();
    const password = generateRandomString(10);

    // Register the user first
    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test User ${generateRandomString(5)}`,
        email,
        password,
      }),
    });

    const response = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.data).toBe('User logged in successfully');
  });

  it('should access the profile endpoint using the session cookie', async () => {
    const email = generateRandomEmail();
    const password = generateRandomString(10);
    const name = `Test User ${generateRandomString(5)}`;

    // Register and login the user first
    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const response = await request('/v1/profile');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      email,
      name,
    });
  });

  it('should add a friend successfully', async () => {
    const userOneEmail = generateRandomEmail();
    const userTwoEmail = generateRandomEmail();
    const password = generateRandomString(10);

    // Register two users
    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `User One ${generateRandomString(5)}`,
        email: userOneEmail,
        password,
      }),
    });

    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `User Two ${generateRandomString(5)}`,
        email: userTwoEmail,
        password,
      }),
    });

    // Login as User One
    await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userOneEmail,
        password,
      }),
    });

    // Add User Two as a friend
    const addFriendResponse = await request('/v1/friends/add', {
      method: 'POST',
      body: JSON.stringify({
        friendEmail: userTwoEmail,
      }),
    });

    expect(addFriendResponse.status).toBe(200);
    expect(addFriendResponse.data).toBe('Friend added successfully');
  });

  it('should retrieve the friend network', async () => {
    const userOneName = `User One ${generateRandomString(5)}`;
    const userOneEmail = generateRandomEmail();
    const password = generateRandomString(10);

    // Register User One
    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: userOneName,
        email: userOneEmail,
        password,
      }),
    });

    // Log in as User One
    await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userOneEmail,
        password,
      }),
    });

    const userTwoName = `User Two ${generateRandomString(5)}`;
    const userTwoEmail = generateRandomEmail();
    // Register User Two
    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: userTwoName,
        email: userTwoEmail,
        password,
      }),
    });

    // Add User Two as a friend
    await request('/v1/friends/add', {
      method: 'POST',
      body: JSON.stringify({
        friendEmail: userTwoEmail,
      }),
    });

    // Retrieve the friend network
    const friendsNetworkResponse = await request('/v1/friends');

    expect(friendsNetworkResponse.status).toBe(200);
    expect(friendsNetworkResponse.data).toEqual([
      {
        name: userTwoName,
        email: userTwoEmail,
        degree: '1st',
      },
    ]);
  });
});
