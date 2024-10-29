import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';

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

  const request = async (
    url: string,
    options: any = {},
    fetchWithCookies = fetchCookie(fetch),
  ) => {
    const response = await fetchWithCookies(`${baseURL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.text();
    try {
      return {
        status: response.status,
        data: JSON.parse(data),
        context: fetchWithCookies,
      };
    } catch {
      return { status: response.status, data, context: fetchWithCookies };
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

    const registerResponse = await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Test User ${generateRandomString(5)}`,
        email,
        password,
      }),
    });

    expect(registerResponse.status).toBe(200);
    expect(registerResponse.data).toBe(
      'User registered and logged in successfully',
    );
  });

  it('should access the profile endpoint using the session cookie', async () => {
    const email = generateRandomEmail();
    const password = generateRandomString(10);
    const name = `Test User ${generateRandomString(5)}`;

    const registerResponse = await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const response = await request('/v1/profile', {}, registerResponse.context);

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
    const loginResponse = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userOneEmail,
        password,
      }),
    });

    // Add User Two as a friend
    const addFriendResponse = await request(
      '/v1/friends/add',
      {
        method: 'POST',
        body: JSON.stringify({
          friendEmail: userTwoEmail,
        }),
      },
      loginResponse.context,
    );

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
    const userOneLoginResponse = await request('/v1/auth/login', {
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
    await request(
      '/v1/friends/add',
      {
        method: 'POST',
        body: JSON.stringify({
          friendEmail: userTwoEmail,
        }),
      },
      userOneLoginResponse.context,
    );

    // Retrieve the friend network
    const friendsNetworkResponse = await request(
      '/v1/friends',
      {},
      userOneLoginResponse.context,
    );

    expect(friendsNetworkResponse.status).toBe(200);
    expect(friendsNetworkResponse.data).toEqual([
      {
        name: userTwoName,
        email: userTwoEmail,
        degree: '1st',
      },
    ]);
  });

  it('should find friends up to the 3rd degree by default', async () => {
    const password = generateRandomString(10);
    const userOneEmail = generateRandomEmail();
    const userTwoEmail = generateRandomEmail();
    const userThreeEmail = generateRandomEmail();
    const userFourEmail = generateRandomEmail();

    // Register Users
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

    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `User Three ${generateRandomString(5)}`,
        email: userThreeEmail,
        password,
      }),
    });

    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `User Four ${generateRandomString(5)}`,
        email: userFourEmail,
        password,
      }),
    });

    const userOneLoginResponse = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userOneEmail,
        password,
      }),
    });

    // Add friends
    await request(
      '/v1/friends/add',
      {
        method: 'POST',
        body: JSON.stringify({
          friendEmail: userTwoEmail,
        }),
      },
      userOneLoginResponse.context,
    );

    const userTwoLoginResponse = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userTwoEmail,
        password,
      }),
    });

    await request(
      '/v1/friends/add',
      {
        method: 'POST',
        body: JSON.stringify({
          friendEmail: userThreeEmail,
        }),
      },
      userTwoLoginResponse.context,
    );

    const userThreeLoginResponse = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: userThreeEmail,
        password,
      }),
    });

    await request(
      '/v1/friends/add',
      {
        method: 'POST',
        body: JSON.stringify({
          friendEmail: userFourEmail,
        }),
      },
      userThreeLoginResponse.context,
    );

    // Retrieve the friend network for User One
    const friendsNetworkResponse = await request(
      '/v1/friends',
      {},
      userOneLoginResponse.context,
    );

    expect(friendsNetworkResponse.status).toBe(200);
    expect(friendsNetworkResponse.data).toEqual([
      {
        name: expect.stringContaining('User Two'),
        email: userTwoEmail,
        degree: '1st',
      },
      {
        name: expect.stringContaining('User Three'),
        email: userThreeEmail,
        degree: '2nd',
      },
      {
        name: expect.stringContaining('User Four'),
        email: userFourEmail,
        degree: '3rd',
      },
    ]);
  });

  it('should return an empty array if user has no friends', async () => {
    const password = generateRandomString(10);
    const lonelyUserEmail = generateRandomEmail();

    // Register a new user with no friends
    await request('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Lonely User ${generateRandomString(5)}`,
        email: lonelyUserEmail,
        password,
      }),
    });

    const lonelyUserLoginResponse = await request('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: lonelyUserEmail,
        password,
      }),
    });

    // Retrieve the friend network
    const friendsNetworkResponse = await request(
      '/v1/friends',
      {},
      lonelyUserLoginResponse.context,
    );

    expect(friendsNetworkResponse.status).toBe(200);
    expect(friendsNetworkResponse.data).toEqual([]);
  });
});
