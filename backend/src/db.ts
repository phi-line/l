import sqlite3 from 'sqlite3';
import { type PersistedPassword } from './pass.js';

export const db = new sqlite3.Database(':memory:'); // For demo purposes, use an in-memory database. In a production environment, we should use a sidecar / hosted DB

/**
 * Inserts a new user into the database.
 * @param {string} name - The name of the user.
 * @param {string} email - The email of the user.
 * @param {PersistedPassword} passwordHash - The hashed password information.
 * @returns {Promise<void>}
 */
export async function insertUser(
  name: string,
  email: string,
  passwordHash: PersistedPassword,
): Promise<void> {
  const { hash, salt, iterations } = passwordHash;
  await new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO user (name, email, password_hash, password_salt, password_iterations) VALUES (?, ?, ?, ?, ?)',
      [name, email, hash, salt, iterations],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

/**
 * Retrieves a user from the database by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<{id: number, name: string, email: string, password_hash: string, password_salt: string, password_iterations: number} | null>}
 */
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

/**
 * Adds a friend relationship between two users.
 * @param {number} userId - The ID of the user.
 * @param {number} friendId - The ID of the friend.
 * @returns {Promise<void>}
 */
export async function addFriend(
  userId: number,
  friendId: number,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    db.run(
      'INSERT INTO friendship (user_id, friend_id) VALUES (?, ?)',
      [userId, friendId],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

/**
 * Formats the degree of friendship.
 * @param {number} degree - The degree of friendship.
 * @returns {string} - The formatted degree.
 */
function formatDegree(degree: number): string {
  if (degree === 1) return '1st';
  if (degree === 2) return '2nd';
  if (degree === 3) return '3rd';
  return `${degree}th`;
}

/**
 * Retrieves the friends network of a user up to a specified degree.
 * @param {number} userId - The ID of the user.
 * @param {number} [maxDegree=3] - The maximum degree of friendship to retrieve.
 * @returns {Promise<Array<{name: string, email: string, degree: string}>>}
 */
export async function getFriendsNetwork(
  userId: number,
  maxDegree: number = 3,
): Promise<Array<{ name: string; email: string; degree: string }>> {
  return new Promise((resolve, reject) => {
    // This query finds the friends network of a user up to the specified degree.
    const query = `
      WITH RECURSIVE
      friend_network(user_id, friend_id, degree, visited) AS (
        SELECT user_id, friend_id, 1 AS degree, ',' || user_id || ',' || friend_id || ',' AS visited
        FROM friendship
        WHERE user_id = ?

        UNION ALL

        SELECT f.user_id, f.friend_id, fn.degree + 1, fn.visited || f.friend_id || ','
        FROM friendship f
        JOIN friend_network fn ON f.user_id = fn.friend_id
        WHERE fn.degree < ? AND INSTR(fn.visited, ',' || f.friend_id || ',') = 0
      )
      SELECT u.name, u.email, MIN(fn.degree) AS degree
      FROM friend_network fn
      JOIN user u ON fn.friend_id = u.id
      GROUP BY fn.friend_id
    `;

    db.all(query, [userId, maxDegree], (err, rows) => {
      if (err) reject(err);
      else {
        const friends = rows.map(
          (row: { name: string; email: string; degree: number }) => ({
            name: row.name,
            email: row.email,
            degree: formatDegree(row.degree),
          }),
        );
        resolve(friends);
      }
    });
  });
}

// Open a database
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_iterations INTEGER NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS friendship (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (friend_id) REFERENCES user(id)
  )
`);
