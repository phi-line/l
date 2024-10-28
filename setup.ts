import { DB } from 'https://deno.land/x/sqlite/mod.ts';

const db = new DB('dev.db');
db.execute(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    password_hash TEXT
  )
`);
