const bcrypt = require('bcrypt');
const { User } = require('../models/user');

/** Login Function */
async function login(req, res) {
  console.log(req.body);
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    // Save user session
    req.session.user = user;

    // Respond with a success message or redirect
    res.status(200).send('User logged in successfully');
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal Server Error');
  }
}

/** Signup Function */
async function signup(req, res) {
  console.log(req.body);
  const { username, email, password } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to the database
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Save the user session (if needed)
    req.session.user = newUser;

    // Respond with a success message or redirect
    res.status(201).send('User signed up successfully');
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = { login, signup };
