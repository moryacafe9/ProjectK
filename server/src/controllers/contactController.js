const validator = require('validator');
const { getDbKind, ensureConnected } = require('../db/auto');
const mysqlModel = require('../models/mysql');
const mongoModel = require('../models/mongo');

function getModel() {
  return getDbKind() === 'mysql' ? mysqlModel : mongoModel;
}

async function submitMessage(req, res, next) {
  try {
    await ensureConnected([{ type: 'contact' }]);
    const { name, email, subject, message } = req.body || {};
    if (email && !validator.isEmail(String(email))) {
      return res.status(400).json({ message: 'Invalid email' });
    }
    if (getDbKind() === 'mysql') {
      await mysqlModel.ensureContactTable();
      await mysqlModel.storeMessage({ name, email, subject, message });
    } else {
      await mongoModel.ensureIndexes();
      await mongoModel.storeMessage({ name, email, subject, message });
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { submitMessage };

