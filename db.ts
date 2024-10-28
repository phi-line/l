import { DB } from 'https://deno.land/x/sqlite/mod.ts';

export function insertUser(name: string, email: string, passwordHash: string) {
  const db = new DB('dev.db');
  db.query('INSERT INTO user (name, email, password_hash) VALUES (?, ?, ?)', [
    name,
    email,
    passwordHash,
  ]);
  db.close();
}

// Open a database
// const db = new DB('test.db');
// db.execute(`
//   CREATE TABLE IF NOT EXISTS user (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     name TEXT,
//     email TEXT,
//     password_hash TEXT
//   )
// `);

// // Insert test data into user table
// for (const { email, password_hash } of [
//   { name: 'Abby', email: 'peter.parker@example.com', password_hash: 'hash1' },
//   { name: 'Barry', email: 'clark.kent@example.com', password_hash: 'hash2' },
//   { name: 'Charlie', email: 'bruce.wayne@example.com', password_hash: 'hash3' },
// ]) {
//   db.query('INSERT INTO user (name, email, password_hash) VALUES (?, ?, ?)', [
//     name,
//     email,
//     password_hash,
//   ]);
// }

// // Verify data in user table
// for (const [id, name, email, password_hash] of db.query(
//   'SELECT id, name, email, password_hash FROM user',
// )) {
//   console.log(
//     `ID: ${id}, Name: ${name}, Email: ${email}, Password Hash: ${password_hash}`,
//   );
// }
