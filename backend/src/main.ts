import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { z } from 'zod';
import {
  insertUser,
  getUserByEmail,
  addFriend,
  getFriendsNetwork,
} from './db.js';
import { generateHashPassword, verifyPassword } from './pass.js';
import { validateName, validateEmail } from './user.js';

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),
);

app.use((req, _, next) => {
  if (!req.session) {
    return next(new Error('Session is not initialized'));
  }
  next();
});

app.get('/', (_, res) => {
  res.send('Welcome to the Dinosaur API!');
});

const registerSchema = z.object({
  name: z.string().refine(validateName, { message: 'Invalid name' }),
  email: z.string().refine(validateEmail, { message: 'Invalid email' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' }),
});

/**
 * Register a new user
 * @route POST /v1/auth/register
 */
app.post('/v1/auth/register', async (req, res) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json(parseResult.error.format());
  }
  const { name, email, password } = parseResult.data;

  console.debug('User registration', { name, email, password }); // TODO: Remove password from logs! Used for demo purposes only!

  // Check if the user already exists
  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.error('User already exists', existingUser);
      return res.status(400).send('User already exists');
    }
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return res.status(500).send('Internal server error');
  }

  const hashedPassword = await generateHashPassword(password);
  insertUser(name, email, hashedPassword);

  try {
    req.session.user = { name, email };
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3);
  } catch (error) {
    console.error('Error setting session variables:', error);
    return res.status(500).send('Internal server error');
  }

  res.status(200).send('User registered and logged in successfully');
});

const loginSchema = z.object({
  email: z.string().refine(validateEmail, { message: 'Invalid email' }),
  password: z.string(),
});

/**
 * Login to an existing account
 * @route POST /v1/auth/login
 */
app.post('/v1/auth/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json(parseResult.error.format());
  }
  const { email, password: passwordAttempt } = parseResult.data;

  // Fetch user from the database
  let user;
  try {
    user = await getUserByEmail(email);
  } catch (error) {
    console.error('Error retrieving user by email:', error);
    return res.status(500).send('Internal server error');
  }
  if (!user) {
    return res.status(401).send('Invalid email or password');
  }

  // Verify password
  const hashedPassword = await verifyPassword(
    {
      hash: user.password_hash,
      salt: user.password_salt,
      iterations: user.password_iterations,
    },
    passwordAttempt,
  );
  if (!hashedPassword) {
    return res.status(401).send('Invalid email or password');
  }

  try {
    req.session.user = { name: user.name, email: user.email };
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3);
  } catch (error) {
    console.error('Error setting session variables:', error);
    return res.status(500).send('Internal server error');
  }

  res.status(200).send('User logged in successfully');
});

/**
 * Retrieve profile data for the authenticated user
 * @route GET /v1/profile
 */
app.get('/v1/profile', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).send('Unauthorized');
  }

  const { email } = req.session.user;

  let user;
  try {
    user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error retrieving user by email:', error);
    return res.status(500).send('Internal server error');
  }

  res.status(200).json({
    email: user.email,
    name: user.name,
  });
});

const addFriendSchema = z.object({
  friendEmail: z.string().refine(validateEmail, { message: 'Invalid email' }),
});

/**
 * Add a friend
 * @route POST /v1/friends/add
 */
app.post('/v1/friends/add', async (req, res) => {
  const parseResult = addFriendSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json(parseResult.error.format());
  }
  const { friendEmail } = parseResult.data;
  const userEmail = req.session.user.email;

  let user;
  try {
    user = await getUserByEmail(userEmail);
  } catch (error) {
    console.error('Error retrieving user by email:', error);
    return res.status(500).send('Internal server error');
  }

  let friend;
  try {
    friend = await getUserByEmail(friendEmail);

    if (!user || !friend) {
      return res.status(404).send('User or friend not found');
    }

    await addFriend(user.id, friend.id);
    res.status(200).send('Friend added successfully');
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * Get friends network
 * @route GET /v1/friends
 */
app.get('/v1/friends', async (req, res) => {
  const userEmail = req.session.user.email;

  let user;
  try {
    user = await getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error retrieving user by email:', error);
    return res.status(500).send('Internal server error');
  }

  const friendsNetwork = await getFriendsNetwork(user.id);
  res.status(200).json(friendsNetwork);
});

app.listen(8000);
console.log('Server is running on port 8000');
