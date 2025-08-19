const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    username: { type: String },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    subject: { type: String },
    message: { type: String }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

async function ensureIndexes() {
  await User.ensureIndexes();
  await Message.ensureIndexes();
}

async function createUser(email, username, passwordHash) {
  const user = await User.create({ email, username, passwordHash });
  return { id: user._id.toString(), email: user.email, username: user.username };
}

async function findUserByEmail(email) {
  return User.findOne({ email });
}

async function storeMessage({ name, email, subject, message }) {
  await Message.create({ name, email, subject, message });
}

module.exports = {
  User,
  Message,
  ensureIndexes,
  createUser,
  findUserByEmail,
  storeMessage
};

