import express from 'express';
import cookieSession from 'cookie-session';
import { insertUser, getUserByEmail } from './db.js';
import { generateHashPassword, verifyPassword } from './pass.js';

const app = express();
app.use(express.json());

app.set('trust proxy', 1); // If you're behind a proxy (e.g., Heroku, AWS ELB)

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

  // Needs string max length validation
  // Needs email format validation

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
  const user = await getUserByEmail(email);
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

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).json({
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(8000);
console.log('Server is running on port 8000');
