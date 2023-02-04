const express = require('express');
const router = express.Router();

// import { getAllUsers } from '../controllers/User';
const { getAllUsers } = require('../controllers/Users');

router.get('/', getAllUsers);

module.exports = router;
