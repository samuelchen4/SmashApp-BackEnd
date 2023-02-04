const express = require('express');
const router = express.Router();

const {
  postNewUser,
  getAddLessonInfo,
  addNewLesson,
  getUserLessonsFromDb,
  changeLessonDate,
} = require('../controllers/navbar');

router.post('/addNewUser', postNewUser);
router.get('/addLesson/Info', getAddLessonInfo);
router.post('/addLesson/purchase/user/:userId', addNewLesson);
router.get('/changeLesson/getUserLessons', getUserLessonsFromDb);
router.put('/changeLesson/purchase/:purchaseId', changeLessonDate);

module.exports = router;
