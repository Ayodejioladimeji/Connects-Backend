const Users = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const passwordMail = require('./passwordMail');

const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID);

const { CLIENT_URL } = process.env;

const userCtrl = {
  // THE SEARCH QUERY
  searchUser: async (req, res) => {
    try {
      const users = await Users.find({
        username: { $regex: req.query.username },
      }).select('email username website mobile avatar');

      res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // GET USER QUERY
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id).select('-password');
      if (!user) return res.status(400).json({ msg: 'User does not exist.' });

      res.json({ user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // UPDATE USER QUERY
  updateUser: async (req, res) => {
    try {
      const { username, avatar, mobile, website } = req.body;
      if (!username)
        return res.status(400).json({ msg: 'Please add your username.' });

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          avatar,
          username,
          mobile,
          website,
        }
      );

      res.json({ msg: 'Update Success!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // USER SUGGESTION QUERY
  suggestionsUser: async (req, res) => {
    try {
      const newArr = [req.user._id];

      const users = await Users.aggregate([
        { $match: { _id: { $nin: newArr } } },
      ]).project('-password');

      return res.json({
        users,
        result: users.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  //  FORGOT PASSWORD QUERY
  forgotPassword: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email } = req.body;
      const user = await Users.findOne({ email });
      if (!user)
        return res.status(400).json({ msg: 'Account does not exist.' });

      const access_token = createAccessToken({ id: user._id });
      const url = `${CLIENT_URL}/user/reset/${access_token}`;

      passwordMail(email, url, 'Reset your password');
      res.json({ msg: ' please check your email to continue.' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // RESET PASSWORD QUERY
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;

      const passwordHash = await bcrypt.hash(password, 12);

      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          password: passwordHash,
        }
      );

      res.json({ msg: 'Password successfully changed!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // GET ALL USER INFORMATION
  getUsersAllInfor: async (req, res) => {
    try {
      const users = await Users.find().select('-password');

      res.json(users);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // UPDATE USERS ROLE BY ADMIN
  updateUsersRole: async (req, res) => {
    try {
      const { role } = req.body;

      await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          role,
        }
      );

      res.json({ msg: 'Update Success!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // DELETE USER QUERY
  deleteUser: async (req, res) => {
    try {
      await Users.findByIdAndDelete(req.params.id);

      res.json({ msg: 'Deleted Success!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // DELETE ACCOUNT QUERY
  deleteAccount: async (req, res) => {
    try {
      await Users.findOneAndRemove({ _id: req.user.id });

      res.json({ msg: 'Account Deleted!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // GOOGLE LOGIN QUERY
  googleLogin: async (req, res) => {
    try {
      const { tokenId } = req.body;

      const verify = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.MAILING_SERVICE_CLIENT_ID,
      });

      const { email_verified, email, name, picture } = verify.payload;

      const password = email + process.env.GOOGLE_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      if (!email_verified)
        return res.status(400).json({ msg: 'Email verification failed.' });

      const user = await Users.findOne({ email });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({ msg: 'Password is incorrect.' });

        const refresh_token = createRefreshToken({ id: user._id });

        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/api/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Login success!' });
      } else {
        const newUser = new Users({
          username: name.trim().toLowerCase(),
          email,
          password: passwordHash,
          avatar: picture,
        });

        await newUser.save();

        const refresh_token = createRefreshToken({ id: newUser._id });

        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/api/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Login success!' });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // FACEBOOK LOGIN QUERY
  facebookLogin: async (req, res) => {
    try {
      const { accessToken, userID } = req.body;

      const URL = `https://graph.facebook.com/v2.9/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`;

      const data = await fetch(URL)
        .then((res) => res.json())
        .then((res) => {
          return res;
        });

      const { email, name, picture } = data;

      const password = email + process.env.FACEBOOK_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await Users.findOne({ email });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(400).json({ msg: 'Password is incorrect.' });

        const refresh_token = createRefreshToken({ id: user._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Login success!' });
      } else {
        const newUser = new Users({
          name,
          email,
          password: passwordHash,
          avatar: picture.data.url,
        });

        await newUser.save();

        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Login success!' });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

// CREATE ACCESS TOKEN
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

module.exports = userCtrl;
