const router = require('express').Router();
const authCtrl = require('../controllers/authCtrl');
const { check } = require('express-validator');

router.post(
  '/register',
  check('username', 'Username is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  authCtrl.register
);

router.post('/activation', authCtrl.activateEmail);

router.post('/login', authCtrl.login);

router.post('/refresh_token', authCtrl.AccessToken);

router.post('/logout', authCtrl.logout);

module.exports = router;
