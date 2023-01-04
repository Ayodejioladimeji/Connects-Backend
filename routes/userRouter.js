const router = require('express').Router();
const { check } = require('express-validator');
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');
const userCtrl = require('../controllers/userCtrl');

router.get('/search', auth, userCtrl.searchUser);

router.get('/user/:id', auth, userCtrl.getUser);

router.patch('/user', auth, userCtrl.updateUser);

router.get('/suggestionsUser', auth, userCtrl.suggestionsUser);

router.post(
  '/forgot',
  check('email', 'Please include a valid email').isEmail(),
  userCtrl.forgotPassword
);

router.post(
  '/reset',
  check(
    'password',
    'Please enter a password with 6 or more characters'
  ).isLength({ min: 6 }),
  auth,
  userCtrl.resetPassword
);

router.get('/all_infor', auth, authAdmin, userCtrl.getUsersAllInfor);

router.patch('/update_role/:id', auth, authAdmin, userCtrl.updateUsersRole);

router.delete('/delete/:id', auth, authAdmin, userCtrl.deleteUser);

router.delete('/delete_account', auth, userCtrl.deleteAccount);

// Social Login
router.post('/google_login', userCtrl.googleLogin);

router.post('/facebook_login', userCtrl.facebookLogin);

module.exports = router;
