import * as crypto from 'crypto';
import express from 'express';
import cookieSession from 'cookie-session';
import { insertUser } from './db.js';

const app = express();
app.use(express.json());
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }),
);

app.get('/', (_, res) => {
  res.send('Welcome to the Dinosaur API!');
});

const hashPassword = async (password: string): Promise<string> => {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
};

type RequestBody = {
  name: string;
  email: string;
  password: string;
};

// Register a new user
app.post('/v1/auth/register', async (req, res) => {
  const body = req.body as unknown as RequestBody;
  console.debug('User registration', body);

  // Needs string max length validation
  // Needs email format validation

  const hashedPassword = await hashPassword(body.password);
  console.debug('hash', hashedPassword);

  const { name, email } = body;
  insertUser(name, email, hashedPassword);

  res.session.nowInMinutes = Math.floor(Date.now() / 60e3);

  res.status(200).send('User registered successfully');
});

// Login to an existing account
app.post('/v1/auth/login', (_, res) => {
  // Logic to authenticate a user
  res.status(200).send('User logged in successfully');
});

// Retrieve profile data for the authenticated user
app.get('/v1/profile', (_, res) => {
  // Logic to retrieve user profile
  res.status(200).json({
    email: 'user@example.com',
    name: 'John Doe',
  });
});

app.listen(8000);
console.log('Server is running on port 8000');
