const express = require('express');
const router = express.Router();

//import functions from Controller
const {
  getLessons,
  addLesson,
  updateLesson,
} = require('../controllers/lessons');

router.get('/', getLessons);
router.post('/add', addLesson);
router.put('/update/:lessonId', updateLesson);

module.exports = router;
