const mysql = require('../database/database-Connect');

const getUserInfo = async (userId) => {
  const userInfo = await mysql.query(`
    SELECT * FROM user
    WHERE user_id = ${userId}
  `);
  await mysql.end();
  return userInfo[0];
};

const getPurchaseInfo = async (userId) => {
  const purchaseInfo = await mysql.query(`
    SELECT * FROM purchases
    LEFT JOIN type
    ON type.type_id = purchases.type_id
    LEFT JOIN scheduled_dates
    ON scheduled_dates.purchase_id = purchases.purchase_id 
    WHERE user_id = ${userId} AND attended = 0
    `);
  await mysql.end();
  return purchaseInfo;
};

const getSalesInfo = async (userId) => {
  const salesInfo = await mysql.query(`
    SELECT * FROM purchases
    LEFT JOIN type
    ON type.type_id = purchases.type_id
    LEFT JOIN scheduled_dates
    ON scheduled_dates.purchase_id = purchases.purchase_id
    WHERE user_id = ${userId} AND attended = 1
    `);
  await mysql.end();
  return salesInfo;
};

const getLessonHistory = async (userId) => {
  const lessonHistory = await mysql.query(`
    SELECT * FROM purchases
    LEFT JOIN discounts
    ON purchases.purchase_id = discounts.purchase_id
    LEFT JOIN creditV2
    ON purchases.purchase_id = creditV2.purchase_id
    LEFT JOIN scheduled_dates
    ON purchases.purchase_id = scheduled_dates.purchase_id
    WHERE purchases.user_id = ${userId}
  `);
  await mysql.end();
  return lessonHistory;
};

const getUnpaidLessons = async (userId) => {
  const unpaidLessons = await mysql.query(`
    SELECT * from purchases
    LEFT JOIN scheduled_dates
    ON purchases.purchase_id = scheduled_dates.purchase_id
    WHERE user_id = ${userId} AND paid = 0
  `);
  await mysql.end();
  return unpaidLessons;
};

const getLessonTypes = async () => {
  const lessonTypes = await mysql.query(`
        SELECT * FROM type    
    `);
  await mysql.end();
  return lessonTypes;
};

const getAvaliableLessons = async (userId) => {
  const avaliableLessons = await mysql.query(`
    SELECT *, SUM(purchases.type_id) AS lessonAmount FROM purchases
    LEFT JOIN type
    ON type.type_id = purchases.type_id
    LEFT JOIN scheduled_dates
    ON scheduled_dates.purchase_id = purchases.purchase_id
    WHERE user_id = ${userId} AND paid = 1 AND attended = 0
    GROUP BY purchases.type_id  
  `);
  await mysql.end();
  return avaliableLessons;
};

const getAllUsers = async () => {
  const users = await mysql.query(`
        SELECT * FROM user
    `);
  await mysql.end();
  return users;
};

const postPurchase = async (
  userId,
  typeId,
  payMethod,
  datePurchased,
  receptInitial_purchase,
  paidStatus,
  lessonName,
  priceWithDiscountIncluded,
  invoiceNumber = 0
) => {
  const purchase = await mysql.query(
    `
        INSERT INTO purchases(user_id, type_id, pay_method, date, receptInitial_purchase, purchaseHandled, attended, paid, lessonName, lessonPrice, invoice)
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
    `,
    [
      userId,
      typeId,
      payMethod,
      datePurchased,
      receptInitial_purchase,
      0,
      0,
      paidStatus,
      lessonName,
      priceWithDiscountIncluded,
      invoiceNumber,
    ]
  );
  await mysql.end();
  return {
    userId: userId,
    purchaseId: purchase.insertId,
    typeId: typeId,
    datePurchased: datePurchased,
    authorizedBy: receptInitial_purchase,
    paidStatus: paidStatus,
    lessonName,
    priceWithDiscountIncluded,
  };
};

//same as postPurchases but you have to declare all parameters
const postPurchaseAll = async (
  userId,
  typeId,
  payMethod,
  datePurchased = new Date(),
  receptInitial_purchase,
  paid,
  attended,
  paidStatus,
  lessonName,
  priceWithDiscountIncluded,
  receptInitial_sale,
  invoiceNumber = 0
) => {
  const purchase = await mysql.query(
    `
        INSERT INTO purchases(user_id, type_id, pay_method, date, receptInitial_purchase, purchaseHandled, attended, paid, lessonName, lessonPrice, receptInitial_sale, invoice)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
    `,
    [
      userId,
      typeId,
      payMethod,
      datePurchased,
      receptInitial_purchase,
      paid,
      attended,
      paidStatus,
      lessonName,
      priceWithDiscountIncluded,
      receptInitial_sale,
      invoiceNumber,
    ]
  );
  await mysql.end();
  return {
    userId: userId,
    purchaseId: purchase.insertId,
    typeId: typeId,
    datePurchased: datePurchased,
    authorizedBy: receptInitial_purchase,
    paid,
    attended,
    paidStatus: paidStatus,
    lessonName,
    priceWithDiscountIncluded,
  };
};

const postScheduledDate = async (
  purchaseId,
  purchaseLessonDate,
  partnerId1,
  partnerId2,
  partnerId3,
  duration
) => {
  const insertIntoScheduledDate = await mysql.query(
    `
        INSERT INTO scheduled_dates(purchase_id, scheduleddate, partner1_id, partner2_id, partner3_id, duration)
        VALUES(?,?,?,?,?,?)`,
    [
      purchaseId,
      purchaseLessonDate,
      partnerId1,
      partnerId2,
      partnerId3,
      duration,
    ]
  );
  await mysql.end();
  return {
    purchaseId: purchaseId,
    lessonDate: purchaseLessonDate,
    partner1: partnerId1,
    partner2: partnerId2,
    partner3: partnerId3,
    duration: duration,
  };
};

const postDiscounts = async (purchaseId, discountAmount, discountNotes) => {
  const insertIntoDiscount = await mysql.query(
    `
        INSERT INTO discounts(purchase_id, amount, description)
        VALUES(?,?,?)`,
    [purchaseId, discountAmount, discountNotes]
  );
  await mysql.end();
  return { purchaseId: purchaseId, discountAmount, discountNotes };
};

// const postPurchaseCredits = async (credit, purchaseId) => {
//   const insertIntoCredits = await mysql.query(
//     `
//         INSERT INTO creditV2(credit, purchase_id, creditAdded)
//         VALUES(?,?,?)`,
//     [-credit, purchaseId, 0]
//   );
//   await mysql.end();
//   return { purchaseId, credit, creditAddedStatus: 0 };
// };

//remake postPurchaseCredits
const postPurchaseCredits = async (credit, purchaseId) => {
  const insertIntoCredits = await mysql.query(
    `
        INSERT INTO creditV2(creditUsed, purchase_id)
        VALUES(?,?)`,
    [-credit, purchaseId]
  );
  await mysql.end();
  return { purchaseId, credit, creditAddedStatus: 0 };
};

//update creditUsed
const updateCreditUsed = async (creditUsed, purchaseId) => {
  const credit = await mysql.query(`
  UPDATE creditV2
  SET creditUsed = ${creditUsed}
  WHERE purchase_id = ${purchaseId}
  `);
};

//update creditAdded
const updateCreditAdded = async (creditAdded, purchaseId) => {
  const credit = await mysql.query(`
  UPDATE creditV2
  SET credit = ${creditAdded}
  WHERE purchase_id = ${purchaseId}
  `);
};
//post creditAdded
const postAddCredits = async (credit, purchaseId) => {
  const addCredits = await mysql.query(
    `
    INSERT INTO creditV2(credit, purchase_id)
    VALUES(?,?)`,
    [credit, purchaseId]
  );
  await mysql.end();
  return { purchaseId, credit, creditAddedStatus: 1 };
};

// const postCreditChange = async (credit, userId, isCreditAdded) => {
//   const insertIntoCredits = await mysql.query(
//     `
//         INSERT INTO creditV2(credit, user_id, creditAdded)
//         VALUES(?,?,?)`,
//     [credit, userId, isCreditAdded]
//   );
//   await mysql.end();
//   return { userId, credit, creditAddedStatus: isCreditAdded };
// };

const postCreditChange = async (credit, purchaseId) => {
  const insertIntoCredits = await mysql.query(
    `
        INSERT INTO creditV2(creditUsed, purchase_id)
        VALUES(?,?)
        ON DUPLICATE KEY
        UPDATE creditUsed = ${credit}`,
    [credit, purchaseId]
  );
  await mysql.end();
  return { purchaseId, credit };
};

const updateUserInfoOnDb = async (
  userId,
  fn,
  ln,
  phone,
  email,
  dob,
  cgStatus,
  medicalDesc
) => {
  const updateUserInfo = await mysql.query(`
    UPDATE user
    SET fn = "${fn}", ln = "${ln}", phone = "${phone}", email = "${email}", dob ="${dob}", isCg = ${cgStatus}, medicalDesc = '${medicalDesc}'
    WHERE user_id = ${userId} 
  `);
  await mysql.end();
  return { userId, fn, ln, phone, email, dob };
};

const updateUnpaidLessons = async (
  purchaseId,
  receptInitials,
  payMethod,
  newLessonPrice
) => {
  const payLessons = await mysql.query(`
    UPDATE purchases
    SET paid = 1, receptInitial_purchase = "${receptInitials}", pay_method="${payMethod}", lessonPrice=${newLessonPrice}
    WHERE purchase_id = ${purchaseId}
  `);
  await mysql.end();
  return `lesson with id: ${purchaseId} was paid for and the new price is: ${newLessonPrice}`;
};

module.exports = {
  getUserInfo,
  getPurchaseInfo,
  getSalesInfo,
  getLessonHistory,
  getUnpaidLessons,
  getLessonTypes,
  getAvaliableLessons,
  getAllUsers,
  postPurchase,
  postPurchaseAll,
  postScheduledDate,
  postDiscounts,
  postPurchaseCredits,
  updateUserInfoOnDb,
  postCreditChange,
  postAddCredits,
  updateCreditUsed,
  updateCreditAdded,
  updateUnpaidLessons,
};
