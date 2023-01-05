const Users = require('../models/userModel');

const authAdmin = async (req, res, next) => {
  try {
    console.log(req.user.id);
    const user = await Users.findOne({ _id: req.user.id });

    if (user.role !== 1) return res.status(500).json({ msg: 'Access Denied!' });

    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = authAdmin;
