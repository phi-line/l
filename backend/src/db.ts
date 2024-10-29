import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');

export async function insertUser(
  name: string,
  email: string,
  passwordHash: string,
): Promise<void> {
  await db.run(
    'INSERT INTO user (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  );
  db.close();
}

// Open a database
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL
  )
`);

// Insert test data into user table
for (const { name, email, password_hash } of [
  { name: 'Abby', email: 'peter.parker@example.com', password_hash: 'hash1' },
  { name: 'Barry', email: 'clark.kent@example.com', password_hash: 'hash2' },
  { name: 'Charlie', email: 'bruce.wayne@example.com', password_hash: 'hash3' },
]) {
  db.run('INSERT INTO user (name, email, password_hash) VALUES (?, ?, ?)', [
    name,
    email,
    password_hash,
  ]);
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
