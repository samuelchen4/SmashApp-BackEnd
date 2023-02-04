const mysql = require('../database/database-Connect');

const addNewUser = async (fn, ln, phone, email, dob) => {
  const newUser = await mysql.query(
    `
        INSERT INTO user(fn,ln,phone,email,dob)
        VALUES(?,?,?,?,?)`,
    [fn, ln, phone, email, dob]
  );
  await mysql.end();
  return { fn, ln, phone, email, dob };
};

const getUserLessons = async () => {
  const userLessons = await mysql.query(`
    SELECT * FROM purchases
    LEFT JOIN scheduled_dates
    ON purchases.purchase_id = scheduled_dates.purchase_id
    WHERE attended = 0 AND purchaseHandled = 0 
  `);
  await mysql.end();

  return userLessons;
};

const changeLessonDateOnDb = async (purchaseId, newLessonDate) => {
  const changeLessonDate = await mysql.query(`
    UPDATE scheduled_dates
    SET scheduleddate = "${newLessonDate}"
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();

  return {
    message: `scheduledDate is now set to ${newLessonDate} for the lesson: ${purchaseId}`,
    newLessonDate,
    purchaseId,
  };
};

module.exports = {
  addNewUser,
  getUserLessons,
  changeLessonDateOnDb,
};
