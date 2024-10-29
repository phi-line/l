import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
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

    // Cookie Options
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

type RequestBody = {
  name: string;
  email: string;
  password: string;
};

// Register a new user
app.post('/v1/auth/register', async (req, res) => {
  const body = req.body as unknown as RequestBody;
  console.debug('User registration', body);

  if (!validateName(body.name) || !validateEmail(body.email)) {
    return res.status(400).send('Invalid name or email');
  }

  // Check if the user already exists
  try {
    const existingUser = await getUserByEmail(body.email);
    if (existingUser) {
      console.error('User already exists', existingUser);
      return res.status(400).send('Invalid name or email');
    }
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return res.status(500).send('Internal server error');
  }

  const hashedPassword = await generateHashPassword(body.password);
  console.debug('hash', hashedPassword);
  const { name, email } = body;
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

// Login to an existing account
app.post('/v1/auth/login', async (req, res) => {
  const { email, password: passwordAttempt } = req.body as {
    email: string;
    password: string;
  };

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

// Retrieve profile data for the authenticated user
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

// Add a friend
app.post('/v1/friends/add', async (req, res) => {
  const { friendEmail } = req.body;
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

// Get friends network
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
