const bcrypt = require('bcrypt');
const User = require('../models/user'); // Adjust the path to your User model

/** Add Target Function */
async function addTarget(req, res) {
  const { coinId, targetPrice } = req.body;
  const userId = req.session.user?._id; // Assuming user session stores the user ID

  if (!userId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Add target to user's targets
    user.targets.push({ coinId, targetPrice });
    await user.save();

    res.status(200).send('Target added successfully');
  } catch (error) {
    console.error('Error adding target:', error);
    res.status(500).send('Internal Server Error');
  }
}

/** Fetch Targets for User */
async function getTargets(req, res) {
  const userId = req.session.user?._id; // Assuming user session stores the user ID

  if (!userId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const user = await User.findById(userId).select('targets'); // Fetch targets only
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(user.targets);
  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { addTarget, getTargets };
