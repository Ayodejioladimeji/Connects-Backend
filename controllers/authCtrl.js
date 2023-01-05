const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const sendMail = require('./sendMail');

const { CLIENT_URL } = process.env;

const authCtrl = {
  // REGISTER THE USER TO RECEIVE MAIL
  register: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, email, password } = req.body;

      // CHECK IF USER EMAIL ALREADY EXISTS
      const user = await Users.findOne({ email });
      if (user)
        return res
          .status(400)
          .json({ msg: 'User already exists with that email' });

      const user_name = await Users.findOne({ username });
      if (user_name)
        return res
          .status(400)
          .json({ msg: 'Username taken, choose another one' });

      // PASSWORD ENCRYPTION
      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = {
        username,
        email,
        password: passwordHash,
      };

      // Then create jsonwebtoken to authentication
      const activation_token = createActivationToken(newUser);
      // console.log(activation_token)

      const url = `${CLIENT_URL}/api/activation/${activation_token}`;
      sendMail(email, username, url, 'verify your email address');

      res.json({
        msg: 'Registration successful! Please check your email to activate your account',
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // ACTIVATE USR ACCOUNT AND STORE IT IN MONGODB
  activateEmail: async (req, res) => {
    try {
      const { activation_token } = req.body;
      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      );

      const { username, email, password } = user;

      // Check if the user already exists
      const check = await Users.findOne({ email });
      if (check) return res.status(400).json({ msg: 'User already exists' });

      const user_name = await Users.findOne({ username });
      if (user_name)
        return res
          .status(400)
          .json({ msg: 'Username taken, choose another one' });

      // Creating the new user object
      const newUser = new Users({
        username: username.trim().toLowerCase(),
        email,
        password,
      });

      // Save information to database
      await newUser.save();
      res.json({
        msg: 'Account Activated',
        user: {
          ...newUser._doc,
          password: '',
        },
      });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  // LOGIN USER
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid Credentials.' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ msg: 'Invalid Credentials.' });

      // GENERATING ACCESS TOKEN
      const access_token = createAccessToken({ id: user._id });
      const refresh_token = createRefreshToken({ id: user._id });

      res.json({
        msg: 'Login Successful',
        access_token,
        user: {
          ...user._doc,
          password: '',
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // GENERATE USER TOKEN
  AccessToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;

      if (!rf_token) return res.status(400).json({ msg: 'Please login now.' });

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) return res.status(400).json({ msg: 'Please login again.' });

          const user = await Users.findById(result.id).select('-password');
          if (!user)
            return res.status(400).json({ msg: 'Account does not exist.' });

          const access_token = createAccessToken({ id: result.id });

          res.json({
            access_token,
            user,
          });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', { path: '/api/refresh_token' });
      return res.json({ msg: 'Logged out!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

// ==========================================================

// Activation token
const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: '10m',
  });
};

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1d',
  });
};

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = authCtrl;
