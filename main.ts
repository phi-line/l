// @deno-types="npm:@types/express@4.17.15"
import express from 'npm:express@4.18.2';
import { crypto } from 'jsr:@std/crypto';
import cookieSession from 'npm:cookie-session';
import { insertUser } from './db.ts';

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

const hashPassword = async (password: string) => {
  const encoder = new TextEncoder();
  const encodedPassword = encoder.encode(password);

  const decoder = new TextDecoder();
  const hashedArray = await crypto.subtle.digest('SHA-256', encodedPassword);
  const hashString = decoder.decode(hashedArray);

  return hashString;
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

  // @ts-ignore
  res.session.nowInMinutes = Math.floor(Date.now() / 60e3);

  res.status(200).send('User registered successfully');
});

// Login to an existing account
app.post('/v1/auth/login', (req, res) => {
  // Logic to authenticate a user
  res.status(200).send('User logged in successfully');
});

// Retrieve profile data for the authenticated user
app.get('/v1/profile', (req, res) => {
  // Logic to retrieve user profile
  res.status(200).json({
    email: 'user@example.com',
    name: 'John Doe',
  });
});

app.listen(8000);
console.log('Server is running on port 8000');
