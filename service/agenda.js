const mysql = require('../database/database-Connect');

//gets private lessons for a date
const getPrivateLessons = async (lessonDate) => {
  //used price including discounts
  // SELECT user.user_id, purchases.purchase_id, type.type_id, fn, ln, email, phone, dob, contacted, type_name, scheduleddate, purchaseHandled, attended, paid, partner1_id, partner2_id, partner3_id, (TRUNCATE(price* (1-IFNULL(amount, 0)),2)) AS priceWithDiscountIncluded
  const privateLessons = await mysql.query(`
    SELECT user.user_id, purchases.purchase_id, purchases.type_id, fn, ln, email, phone, dob, contacted, scheduleddate, purchaseHandled, attended, paid, partner1_id, partner2_id, partner3_id, lessonName, lessonPrice  AS priceWithDiscountIncluded
    FROM user
    INNER JOIN purchases
    ON user.user_id = purchases.user_id
    INNER JOIN scheduled_dates
    ON purchases.purchase_id = scheduled_dates.purchase_id
    WHERE scheduleddate = "${lessonDate}" AND lessonName LIKE '% PRIVATE%'
  `);

  await mysql.end();
  return privateLessons;
};

const getSemiPrivateLessons = async (lessonDate) => {
  const semiPrivateLessons = await mysql.query(`
    SELECT user.user_id, purchases.purchase_id, purchases.type_id, fn, ln, email, phone, dob, contacted, scheduleddate, purchaseHandled, attended, paid, partner1_id, partner2_id, partner3_id, lessonName, lessonPrice  AS priceWithDiscountIncluded
    FROM user
    INNER JOIN purchases
    ON user.user_id = purchases.user_id
    INNER JOIN scheduled_dates
    ON purchases.purchase_id = scheduled_dates.purchase_id
    WHERE scheduleddate = "${lessonDate}" AND lessonName LIKE '%SEMI-PRIVATE%'
  `);
  await mysql.end();
  return semiPrivateLessons;
};

const getPartnerData = async (partner1Id, partner2Id, partner3Id) => {
  const partnerInfo = await mysql.query(`
    SELECT * FROM user
    WHERE user_id = ${partner1Id} OR user_id = ${partner2Id} OR user_id = ${partner3Id}
  `);
  await mysql.end();
  return partnerInfo;
};

//gets group lessons for a date
const getGroupLessons = async (lessonDate) => {
  const groupLessons = await mysql.query(`
      SELECT type.type_id, type_name as lessonName, scheduleddate, start_time, end_time, price, capacity
      FROM user
      INNER JOIN purchases
      ON user.user_id = purchases.user_id
      INNER JOIN type
      ON purchases.type_id = type.type_id
      INNER JOIN scheduled_dates
      ON purchases.purchase_id = scheduled_dates.purchase_id
      WHERE scheduleddate = "${lessonDate}" AND type_name NOT LIKE '%PRIVATE%'
      GROUP BY type_name
  `);

  await mysql.end();
  return groupLessons;
};

const getClasslist = async (lessonType, lessonDate) => {
  const classlist = await mysql.query(`
       SELECT user.user_id, purchases.purchase_id, purchases.type_id ,fn, ln, email, phone, medicalDesc, scheduleddate, purchaseHandled, attended, paid, lessonPrice  AS priceWithDiscountIncluded, lessonName
      FROM user
      INNER JOIN purchases
      ON user.user_id = purchases.user_id
      LEFT JOIN discounts
      ON purchases.purchase_id = discounts.purchase_id
      INNER JOIN type
      ON purchases.type_id = type.type_id
      INNER JOIN scheduled_dates
      ON purchases.purchase_id = scheduled_dates.purchase_id
      WHERE type.type_id = ${lessonType} AND scheduleddate = '${lessonDate}'
  `);
  await mysql.end();
  return classlist;
};

//updated for new db design
const postAttendedLesson = async (receptInitialSale, purchaseId) => {
  const attendedGroupClass = await mysql.query(`
    UPDATE purchases
    SET purchaseHandled = 1, attended = 1, receptInitial_sale = "${receptInitialSale}"
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return {
    message: `lesson for a purchaseId of ${purchaseId} was attended. authorized by ${receptInitialSale}`,
  };
};

//updated for new db design
// const postDidntAttendClass = async (
//   receptInitialSale,
//   purchaseId,
//   lessonPrice
// ) => {
//   const didntAttendGroupClass = await mysql.query(`
//     UPDATE purchases
//     SET purchaseHandled = 1, attended = 1, recept_initialSale = ${receptInitialSale}
//     WHERE purchase_id = ${purchaseId}
//   `);

//   //rollover missed lesson into credit
//   const rolloverToCredit = await mysql.query(
//     `
//     INSERT INTO creditV2(credit, purchase_id)
//     VALUES(?,?)`,
//     [lessonPrice, purchaseId]
//   );
//   await mysql.end();
//   return {
//     message: `lesson for a purchaseId of ${purchaseId} was not attended. $${lessonPrice} was converted to credit. authorized by ${receptInitialSale}.`,
//   };
// };

//updated for new db design
const postLessonToCredit = async (purchaseId, lessonPrice) => {
  const lessonToCredit = await mysql.query(
    `
    INSERT INTO creditV2(credit, purchase_id)
    VALUES(?, ?)
    ON DUPLICATE KEY
    UPDATE credit = ${lessonPrice}`,
    [lessonPrice, purchaseId]
  );
  await mysql.end();
  return `$${lessonPrice} was converted to credit for purchaseId of ${purchaseId}.`;
};

//add user to purchases but unpaid. Also add date of lesson
//updated for new db design
const quickAddToGroup = async (
  userId,
  lessonType,
  lessonDate,
  lessonPrice,
  duration,
  currentDate,
  receptInitialPurchase,
  payMethod,
  lessonName
) => {
  const addUnpaidToPurchases = await mysql.query(
    `
    INSERT INTO purchases(user_id, type_id, date, lessonPrice, receptInitial_purchase, purchaseHandled, paid, pay_method, lessonName)
    VALUES(?,?,?,?,?,?,?,?,?)`,
    [
      userId,
      lessonType,
      currentDate,
      lessonPrice,
      receptInitialPurchase,
      0,
      0,
      payMethod,
      lessonName,
    ]
  );

  const purchaseId = addUnpaidToPurchases.insertId;
  const addScheduledDate = await mysql.query(
    `
    INSERT INTO scheduled_dates(purchase_id, scheduleddate, duration, partner1_id, partner2_id, partner3_id)
    VALUES(?,?,?,?,?,?)`,
    [purchaseId, lessonDate, duration, 0, 0, 0]
  );
  await mysql.end();
  return {
    message: `added unpaid lesson for the user:${userId} and lesson type ${lessonType} on ${lessonDate}`,
    purchaseId,
  };
};

//updated for new db design
// const postAttendedLesson = async (receptInitialSale, purchaseId) => {
//   const attendedLesson = await mysql.query(`
//     UPDATE purchases
//     SET purchaseHandled = 1, attended = 1, receptInitial_sale = ${receptInitialSale}
//     WHERE purchase_id = ${purchaseId}
//   `);
//   await mysql.end();
//   return attendedLesson;
// };

//updated for new db design
const putDeleteSale = async (purchaseId) => {
  const deleteSale = await mysql.query(`
    UPDATE purchases
    SET purchaseHandled = 0, attended = 0, receptInitial_sale = ""
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return { deleteSale };
};

// const deleteCreditUsed = async (purchaseId, isCreditAdded) => {
//   const credit = await mysql.query(`
//     DELETE FROM creditV2
//     WHERE purchase_id = ${purchaseId} AND creditAdded = ${isCreditAdded}
//   `);
//   await mysql.end();
//   return `credit for purchaseId ${purchaseId} where creditedAdded = ${isCreditAdded} was deleted`;
// };

const deleteCreditUsed = async (purchaseId) => {
  const credit = await mysql.query(`
    UPDATE creditV2
    SET credit = 0
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return `credit for purchaseId ${purchaseId} was deleted`;
};

const setPurchaseHandledToTrue = async (purchaseId) => {
  const changePurchaseHandledToTrue = await mysql.query(`
    UPDATE purchases
    SET purchaseHandled = 1
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return `purchaseHandled changed to 1 for purchaseId: ${purchaseId}`;
};

const setPurchaseHandledToFalse = async (purchaseId) => {
  const changePurchaseHandledToFalse = await mysql.query(`
    UPDATE purchases
    SET purchaseHandled = 0
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return `purchaseHandled changed to 0 for purchaseId: ${purchaseId}`;
};

module.exports = {
  getPrivateLessons,
  getSemiPrivateLessons,
  getPartnerData,
  getGroupLessons,
  getClasslist,
  postLessonToCredit,
  quickAddToGroup,
  postAttendedLesson,
  putDeleteSale,
  setPurchaseHandledToFalse,
  setPurchaseHandledToTrue,
  deleteCreditUsed,
};
