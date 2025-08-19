const { getMysqlPool } = require('../db/auto');

async function ensureUserTable() {
  const pool = getMysqlPool();
  const sql = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await pool.execute(sql);
}

async function ensureContactTable() {
  const pool = getMysqlPool();
  const sql = `CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    subject VARCHAR(255) NULL,
    message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  await pool.execute(sql);
}

async function createUser(email, username, passwordHash) {
  const pool = getMysqlPool();
  const [result] = await pool.execute(
    'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
    [email, username, passwordHash]
  );
  return { id: result.insertId, email, username };
}

async function findUserByEmail(email) {
  const pool = getMysqlPool();
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function storeMessage({ name, email, subject, message }) {
  const pool = getMysqlPool();
  await pool.execute(
    'INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [name || null, email || null, subject || null, message || null]
  );
}

module.exports = {
  ensureUserTable,
  ensureContactTable,
  createUser,
  findUserByEmail,
  storeMessage
};

