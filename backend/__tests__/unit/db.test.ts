import { describe, it, beforeAll, expect } from 'vitest';
import {
  insertUser,
  addFriend,
  getFriendsNetwork,
  getUserByEmail,
  db,
} from '../../src/db.js';
import { type PersistedPassword } from '../../src/pass.js';

describe('Degrees of Friendships', () => {
  let userId1: number;
  let userId2: number;
  let userId3: number;
  let userId4: number;
  let userId5: number;

  const passwordHash: PersistedPassword = {
    hash: 'hashedpassword',
    salt: 'randomsalt',
    iterations: 1000,
  };

  beforeAll(async () => {
    // Initialize the database tables
    await new Promise<void>((resolve, reject) => {
      db.exec(
        `
        CREATE TABLE IF NOT EXISTS user (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          password_iterations INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS friendship (
          user_id INTEGER NOT NULL,
          friend_id INTEGER NOT NULL,
          PRIMARY KEY (user_id, friend_id),
          FOREIGN KEY (user_id) REFERENCES user(id),
          FOREIGN KEY (friend_id) REFERENCES user(id)
        );
        `,
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });

    // Insert users
    await insertUser('User One', 'user1@example.com', passwordHash);
    await insertUser('User Two', 'user2@example.com', passwordHash);
    await insertUser('User Three', 'user3@example.com', passwordHash);
    await insertUser('User Four', 'user4@example.com', passwordHash);
    await insertUser('User Five', 'user5@example.com', passwordHash);

    // Retrieve user IDs
    const user1 = await getUserByEmail('user1@example.com');
    const user2 = await getUserByEmail('user2@example.com');
    const user3 = await getUserByEmail('user3@example.com');
    const user4 = await getUserByEmail('user4@example.com');
    const user5 = await getUserByEmail('user5@example.com');

    if (user1 && user2 && user3 && user4 && user5) {
      userId1 = user1.id;
      userId2 = user2.id;
      userId3 = user3.id;
      userId4 = user4.id;
      userId5 = user5.id;

      // Create friendships
      await addFriend(userId1, userId2); // User One -> User Two
      await addFriend(userId2, userId3); // User Two -> User Three
      await addFriend(userId3, userId4); // User Three -> User Four
      await addFriend(userId4, userId5); // User Four -> User Five
    } else {
      throw new Error('Failed to retrieve user IDs');
    }
  });

  it('should find friends up to the 3rd degree by default', async () => {
    const friends = await getFriendsNetwork(userId1);
    expect(friends).toEqual([
      { name: 'User Two', email: 'user2@example.com', degree: '1st' },
      { name: 'User Three', email: 'user3@example.com', degree: '2nd' },
      { name: 'User Four', email: 'user4@example.com', degree: '3rd' },
    ]);
    expect(friends).not.toContainEqual({
      name: 'User Five',
      email: 'user5@example.com',
      degree: '4th',
    });
  });

  it('should find friends up to the 4th degree when specified', async () => {
    const friends = await getFriendsNetwork(userId1, 4);
    expect(friends).toEqual([
      { name: 'User Two', email: 'user2@example.com', degree: '1st' },
      { name: 'User Three', email: 'user3@example.com', degree: '2nd' },
      { name: 'User Four', email: 'user4@example.com', degree: '3rd' },
      { name: 'User Five', email: 'user5@example.com', degree: '4th' },
    ]);
  });

  it('should return an empty array if user has no friends', async () => {
    // Insert a new user with no friends
    await insertUser('Lonely User', 'lonely@example.com', passwordHash);
    const lonelyUser = await getUserByEmail('lonely@example.com');

    if (lonelyUser) {
      const friends = await getFriendsNetwork(lonelyUser.id);
      expect(friends).toEqual([]);
    } else {
      throw new Error('Failed to retrieve lonely user ID');
    }
  });
});
