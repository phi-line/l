import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
import { type PersistedPassword } from './pass.js';

export async function insertUser(
  name: string,
  email: string,
  passwordHash: PersistedPassword,
): Promise<void> {
  const { hash, salt, iterations } = passwordHash;
  await db.run(
    'INSERT INTO user (name, email, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?)',
    [name, email, hash, salt, iterations],
  );
}

export async function getUserByEmail(email: string): Promise<{
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
} | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, name, email, password_hash, password_salt, password_iterations FROM user WHERE email = ? LIMIT 1',
      [email],
      (
        err,
        row: {
          id: number;
          name: string;
          email: string;
          password_hash: string;
          password_salt: string;
          password_iterations: number;
        } | null,
      ) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      },
    );
  });
}

// Open a database
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INTEGER NOT NULL
  )
`);

// Insert test data into user table
for (const {
  name,
  email,
  password_hash,
  password_salt,
  password_iterations,
} of [
  {
    name: 'Abby',
    email: 'peter.parker@example.com',
    password_hash: 'hash1',
    password_salt: 'salt1',
    password_iterations: 10000,
  },
  {
    name: 'Barry',
    email: 'clark.kent@example.com',
    password_hash: 'hash2',
    password_salt: 'salt2',
    password_iterations: 10000,
  },
  {
    name: 'Charlie',
    email: 'bruce.wayne@example.com',
    password_hash: 'hash3',
    password_salt: 'salt3',
    password_iterations: 10000,
  },
]) {
  db.run(
    'INSERT INTO user (name, email, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?)',
    [name, email, password_hash, password_salt, password_iterations],
  );
}

// Verify data in user table
db.each(
  'SELECT id, name, email, password_hash FROM user',
  (
    err,
    row: { id: string; name: string; email: string; password_hash: string },
  ) => {
    if (err) {
      throw err;
    }
    console.log('Printing test data');
    console.log(
      `ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Password Hash: ${row.password_hash}`,
    );
  },
);
