const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  coinId: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  targets: [targetSchema], // Array of targets
});

const User=mongoose.model('UserNew', userSchema);
module.exports = {User}
