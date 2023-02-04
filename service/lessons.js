const mysql = require('../database/database-Connect');

const getLessonsFromDb = async () => {
  const lessons = await mysql.query(`
        SELECT * FROM type
    `);
  await mysql.end();
  return lessons;
};

const addLessonToDb = async (lessonName, lessonPrice, lessonCapacity) => {
  const addLesson = await mysql.query(
    `
    INSERT INTO type(type_name, price, Capacity)
    VALUES(?,?,?)`,
    [lessonName, lessonPrice, lessonCapacity]
  );
  const lessonId = addLesson.insertId;
  await mysql.end();
  return { lessonId, lessonName, lessonPrice, lessonCapacity };
};

const updateLessonOnDb = async (
  lessonId,
  lessonName,
  lessonPrice,
  lessonCapacity
) => {
  const updateLesson = await mysql.query(`
        UPDATE type
        SET type_name = "${lessonName}", price = ${lessonPrice}, Capacity = ${lessonCapacity}
        WHERE type_id = ${lessonId} 
    `);
  await mysql.end();
  return { lessonId, lessonName, lessonPrice, lessonCapacity };
};

module.exports = {
  getLessonsFromDb,
  addLessonToDb,
  updateLessonOnDb,
};
