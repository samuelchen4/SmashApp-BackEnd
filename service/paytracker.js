const mysql = require('../database/database-Connect');

//prints out users with more sales than purchases
const getTrackerData = async () => {
  const trackerData = await mysql.query(`
    SELECT purchases.user_id, fn, ln, email, phone, dob, contacted, contactedBy, isCg, medicalDesc
    FROM purchases
    LEFT JOIN user
    ON purchases.user_id = user.user_id
    WHERE attended = 1 AND paid = 0
    GROUP BY purchases.user_id;
  `);

  await mysql.end();
  return trackerData;
};

//gets info about overdue lessons, passing in a userId
const getLessonsOwed = async (userId) => {
  const lessonsOwed = await mysql.query(`
    SELECT purchases.user_id, purchases.type_id, type_name, COUNT(purchases.type_id) AS lessonAmount
    FROM purchases
    LEFT JOIN type
    ON purchases.type_id = type.type_id
    WHERE user_id = ${userId} AND paid = 0 AND attended = 1
    GROUP BY purchases.user_id, purchases.type_id
    ORDER BY purchases.user_id, purchases.type_Id
  `);

  await mysql.end();
  return lessonsOwed;
};

const getAmountOwed = async (userId) => {
  const amountOwed = await mysql.query(`
    SELECT user_id, SUM(lessonPrice) as amountOwed
    FROM purchases
    WHERE user_id = ${userId} AND paid = 0 AND attended = 1
  `);
  await mysql.end();
  return amountOwed[0];
};

const getEveryOverdueLesson = async (userId) => {
  const everyOverdueLesson = await mysql.query(`
    SELECT * FROM purchases
    WHERE attended = 1 AND paid = 0 AND user_id = ${userId}
  `);
  await mysql.end();
  return everyOverdueLesson;
};

// const getUserInfo = async (userId) => {
//   const userInfo = await mysql.query(`
//       SELECT user_id, fn, ln, email, phone, SUM(credit) AS credits
//         FROM
//           (SELECT user.user_id, fn, ln, email, phone, sales.sale_id, type_id, date, recept_initial, start_time, end_time, credit_id, credit
//           FROM user
//           INNER JOIN sales
//           ON user.user_id = sales.user_id
//           INNER JOIN credit
//           ON sales.sale_id = credit.sale_id
//           WHERE user.user_id = ${userId}) AS creditList
//         GROUP BY user_id
//         `);
//   await mysql.end();
//   return userInfo[0];
// };

// const getCredits = async (userId) => {
//   const credits = await mysql.query(`
//     SELECT creditV2.user_id, SUM(credit) as credit
//     FROM creditV2
//     LEFT JOIN purchases
//     ON creditV2.purchase_id = purchases.purchase_id
//     WHERE creditV2.user_id = ${userId} or purchases.user_id = ${userId}
//   `);
//   await mysql.end();
//   return credits[0];
// };

const getCredits = async (userId) => {
  const credits = await mysql.query(`
    SELECT user.user_id, fn, ln , SUM((IFNULL(creditUsed, 0)+IFNULL(credit, 0))) AS credit FROM user
    LEFT JOIN purchases
    ON user.user_id = purchases.user_id
    LEFT JOIN creditV2
    ON purchases.purchase_id = creditV2.purchase_id
    WHERE user.user_id = ${userId}
  `);
  await mysql.end();
  return credits[0];
};

const changeContactStatus = async (userId, contactedStatus, contactedBy) => {
  const contactStatus = await mysql.query(`
    UPDATE user
    SET contacted = ${contactedStatus}, contactedBy = '${contactedBy}'
    WHERE user_id = ${userId}
  `);
  await mysql.end();
};

const changePaidStatus = async (
  purchaseId,
  receptInitials,
  payMethod,
  invoice = 0
) => {
  const paidStatus = await mysql.query(`
    UPDATE purchases
    SET paid = 1, receptInitial_purchase = "${receptInitials}", pay_method="${payMethod}", invoice = ${invoice}
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return `paid status changed to 1 for purchaseId:${purchaseId}`;
};

module.exports = {
  getTrackerData,
  getAmountOwed,
  getLessonsOwed,
  changeContactStatus,
  getCredits,
  getEveryOverdueLesson,
  changePaidStatus,
  // getOwedLessonsInfo,
};
