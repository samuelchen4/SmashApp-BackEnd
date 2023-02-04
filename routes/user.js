const express = require('express');
const router = express.Router();

const {
  getInfo,
  buyLesson,
  updateInfo,
  payUnpaidLessons,
} = require('../controllers/user');

router.get('/:userId', getInfo);
router.post('/:userId/purchase', buyLesson);
router.put('/:userId', updateInfo);
router.put('/:userId/payUnpaidLessons', payUnpaidLessons);

module.exports = router;
