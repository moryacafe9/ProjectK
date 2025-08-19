/*
 Auto-select DB between MongoDB and MySQL based on detected forms.
 - Heuristic: If there is a free-form message/contact form or highly variable fields, prefer MongoDB.
 - Otherwise default to MySQL for structured auth schemas.
*/
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

let dbKind = null; // 'mysql' | 'mongo'
let mysqlPool = null;
let connected = false;

function decideDbKind(detectedForms) {
  // If any contact form detected -> choose MongoDB (flexible messages)
  const hasContact = detectedForms.some(f => f.type === 'contact');
  if (hasContact) return 'mongo';
  // If only auth-related forms -> MySQL
  return 'mysql';
}

async function connectMySQL() {
  const pool = await mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'classico',
    connectionLimit: 10,
    multipleStatements: false
  });
  mysqlPool = pool;
  connected = true;
  return pool;
}

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/classico';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { autoIndex: true });
  }
  connected = true;
  return mongoose.connection;
}

async function connectAuto(detectedForms = [{ type: 'login' }]) {
  dbKind = decideDbKind(detectedForms);
  if (dbKind === 'mysql') {
    await connectMySQL();
  } else {
    await connectMongo();
  }
}

function getDbKind() {
  return dbKind || 'mysql';
}

function getMysqlPool() {
  return mysqlPool;
}

async function ensureConnected(defaultForms = [{ type: 'login' }]) {
  if (!connected) {
    await connectAuto(defaultForms);
  }
}

function isConnected() {
  return connected;
}

module.exports = { connectAuto, decideDbKind, getDbKind, getMysqlPool, ensureConnected, isConnected };

