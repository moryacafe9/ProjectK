const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { getDbKind, ensureConnected } = require('../db/auto');
const mysqlModel = require('../models/mysql');
const mongoModel = require('../models/mongo');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'change_me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function getModel() {
  return getDbKind() === 'mysql' ? mysqlModel : mongoModel;
}

function validateEmail(email) {
  return validator.isEmail(String(email || ''));
}

async function signup(req, res, next) {
  try {
    await ensureConnected([{ type: 'login' }]);
    const { email, password, username } = req.body || {};
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const model = getModel();
    if (getDbKind() === 'mysql') {
      await mysqlModel.ensureUserTable();
    } else {
      await mongoModel.ensureIndexes();
    }
    const existing = await model.findUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    const hash = await bcrypt.hash(String(password), 12);
    const user = await model.createUser(email, username || null, hash);
    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({ user: { id: user.id, email: user.email, username: user.username }, token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    await ensureConnected([{ type: 'login' }]);
    const { email, password } = req.body || {};
    if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
    const model = getModel();
    if (getDbKind() === 'mysql') {
      await mysqlModel.ensureUserTable();
    } else {
      await mongoModel.ensureIndexes();
    }
    const user = await model.findUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const hash = user.password_hash || user.passwordHash;
    const ok = await bcrypt.compare(String(password || ''), String(hash || ''));
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const userId = user.id || user._id?.toString();
    const token = signToken({ sub: userId, email: user.email });
    res.json({ token });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };

