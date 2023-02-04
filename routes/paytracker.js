const express = require('express');
const router = express.Router();

const {
  payTrackerData,
  getOverdueLessons,
  changeContactedStatus,
  changePayStatus,
} = require('../controllers/paytracker');

router.get('/', payTrackerData);
router.get('/user/:userId', getOverdueLessons);
router.put('/user/:userId/changeContacted', changeContactedStatus);
router.put('/user/:userId/payOwedLessons', changePayStatus);

module.exports = router;
