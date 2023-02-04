const {
  addNewUser,
  getUserLessons,
  changeLessonDateOnDb,
} = require('../service/navbar');
const {
  getAllUsers,
  getLessonTypes,
  postPurchase,
  postScheduledDate,
} = require('../service/user');

const postNewUser = async (req, res) => {
  try {
    const fn = req.body.fn;
    const ln = req.body.ln;
    const phone = req.body.phone;
    const email = req.body.email;
    const dob = req.body.dob;

    const newUser = await addNewUser(fn, ln, phone, email, dob);

    return res.status(200).json(newUser);
  } catch (err) {
    console.log(`Error in postNewUser method. the error is: ${err}`);
    return res
      .status(400)
      .json(`Error in postNewUser method. the error is: ${err}`);
  }
};

const getAddLessonInfo = async (req, res) => {
  try {
    const allUsers = await getAllUsers();
    const allLessons = await getLessonTypes();

    return res.status(200).json({ allUsers, allLessons });
  } catch (err) {
    console.log(`Error in getAddLessonInfo method. the Error is: ${err}`);
    return res
      .status(400)
      .json(`Error in getAddLessonInfo method. the Error is: ${err}`);
  }
};

const addNewLesson = async (req, res) => {
  try {
    //get params and body properties
    const userId = req.params.userId;

    const receptInitials = req.body.receptInitials;
    const lessonId = req.body.lessonId;
    const lessonName = req.body.lessonName;
    const lessonPrice = req.body.lessonPrice;
    const partnerArr = req.body.partnerArr;
    const purchaseLessonDate = req.body.purchaseLessonDate;

    const duration = 1;
    const todaysDate = new Date();

    let partnerIds = [0, 0, 0];
    let partnerResponseInfo = [{}, {}, {}];

    if (partnerArr.length) {
      partnerArr.forEach((partner, index) => {
        partnerIds[index] = partner.value;
      });
    }

    const purchase = await postPurchase(
      userId,
      lessonId,
      'Not Paid',
      todaysDate,
      receptInitials,
      0,
      lessonName,
      lessonPrice
    );

    const purchaseId = purchase.purchaseId;

    const scheduledDate = await postScheduledDate(
      purchaseId,
      purchaseLessonDate,
      partnerIds[0],
      partnerIds[1],
      partnerIds[2],
      duration
    );

    if (partnerArr.length) {
      await Promise.all(
        partnerIds.map(async (partnerId, index) => {
          if (partnerId) {
            const newUserId = partnerId;
            let modifiedPartnerIds = partnerIds.slice(0);
            partnerResponseInfo[index].purchase = await postPurchase(
              newUserId,
              lessonId,
              'Not Paid',
              todaysDate,
              receptInitials,
              0,
              lessonName,
              lessonPrice
            );
            const partnerPurchaseId =
              partnerResponseInfo[index].purchase.purchaseId;
            modifiedPartnerIds[index] = userId;

            partnerResponseInfo[index].scheduledDates = await postScheduledDate(
              partnerPurchaseId,
              purchaseLessonDate,
              modifiedPartnerIds[0],
              modifiedPartnerIds[1],
              modifiedPartnerIds[2],
              duration
            );
          }
        })
      );
    }

    return res.status(200).json({
      purchase,
      scheduledDate,
      partnerInfo: partnerResponseInfo,
      partnerIds,
    });
  } catch (err) {
    console.log(`error in addNewLesson method. The error is: ${err}`);
    return res
      .status(400)
      .json(`error in addNewLesson method. The error is: ${err}`);
  }
};

const getUserLessonsFromDb = async (req, res) => {
  try {
    const userLessons = await getUserLessons();

    return res.status(200).json(userLessons);
  } catch (err) {
    console.log(`error in getUserlessonsFromDb method. Error is: ${err}`);
    return res
      .status(400)
      .json(`error in getUserlessonsFromDb method. Error is: ${err}`);
  }
};

const changeLessonDate = async (req, res) => {
  try {
    const purchaseId = req.params.purchaseId;

    const newLessonDate = req.body.newLessonDate;

    const changedDate = await changeLessonDateOnDb(purchaseId, newLessonDate);

    return res.status(200).json(changedDate);
  } catch (err) {
    console.log(`error in changeLessonDate method. Error is: ${err}`);
    return res
      .status(400)
      .json(`error in changeLessonDate method. Error is: ${err}`);
  }
};

module.exports = {
  postNewUser,
  getAddLessonInfo,
  addNewLesson,
  getUserLessonsFromDb,
  changeLessonDate,
};
