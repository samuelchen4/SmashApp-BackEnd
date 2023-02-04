const {
  getLessonsFromDb,
  addLessonToDb,
  updateLessonOnDb,
} = require('../service/lessons');

const getLessons = async (req, res) => {
  try {
    const lessons = await getLessonsFromDb();
    return res.status(200).json(lessons);
  } catch (err) {
    console.log(`error in getLessons method. The error is: ${err}`);
    return res
      .status(404)
      .json(`error in getLessons method. The error is: ${err}`);
  }
};

const addLesson = async (req, res) => {
  try {
    const lessonName = req.body.lessonName;
    const lessonPrice = req.body.lessonPrice;
    const lessonCapacity = req.body.lessonCapacity;

    const addedLesson = await addLessonToDb(
      lessonName,
      lessonPrice,
      lessonCapacity
    );
    return res
      .status(200)
      .json({ message: 'lesson was added to database', ...addedLesson });
  } catch (err) {
    console.log(`error in addLesson method. The error is: ${err}`);
    return res
      .status(404)
      .json(`error in addLesson method. The error is: ${err}`);
  }
};

const updateLesson = async (req, res) => {
  try {
    const lessonId = req.params.lessonId;

    const lessonName = req.body.lessonName;
    const lessonPrice = req.body.lessonPrice;
    const lessonCapacity = req.body.lessonCapacity;

    const updatedLesson = await updateLessonOnDb(
      lessonId,
      lessonName,
      lessonPrice,
      lessonCapacity
    );

    return res.status(200).json({
      message: `lesson with Id of: ${lessonId} was updated.`,
      ...updatedLesson,
    });
  } catch (err) {
    return res
      .status(404)
      .json(`error in updateLessons method. The error is: ${err}`);
  }
};
module.exports = {
  getLessons,
  addLesson,
  updateLesson,
};
