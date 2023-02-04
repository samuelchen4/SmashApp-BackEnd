const express = require('express');
const app = express();

const {
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
} = require('../service/agenda');
const { getUserInfo } = require('../service/user');

const getLessons = async (req, res) => {
  try {
    const lessonDate = req.params.lessonDate;

    const privateLessons = await getPrivateLessons(lessonDate); //private lessons
    const groupLessons = await getGroupLessons(lessonDate); //group lessons

    const semiPrivateLessons = await getSemiPrivateLessons(lessonDate); //semi private lessons

    //combine private and group lessons
    const data = groupLessons.concat(privateLessons, semiPrivateLessons);

    // console.log(data);
    return res.status(200).json(data);
    //   .json({ values: { privateLessons, groupLessons }, date: selectedDate });
  } catch (err) {
    console.log(`Error in getAgendaInfo ${err}`);
    return res.status(404).json({ message: `Error in getAgendaInfo ${err}` });
  }
};

const getGroupClasslist = async (req, res) => {
  try {
    const lessonType = req.params.lessonType;
    const lessonDate = req.params.lessonDate;

    //get classlist based on classType and selectedDate
    const classlist = await getClasslist(lessonType, lessonDate);

    res.status(200).json(classlist);
  } catch (err) {
    console.log(`cannot get classlist for ${lessonType} because ${err}`);
    res.status(404).json({
      message: `cannot get classlist for ${lessonType} because ${err}`,
    });
  }
};

const submitClasslist = async (req, res) => {
  try {
    // const lessonType = req.params.lessonType;
    // const lessonDate = req.params.lessonDate;
    const purchaseId = req.params.purchaseId;

    // const userId = req.body.userId;
    const lessonPrice = req.body.lessonPrice;
    //comes from the attendance sheet on front-end
    const didAttend = req.body.attended;
    const paid = req.body.paid;

    //body params that need to be configured on front-end
    const receptInitialSale = req.body.receptInitials;

    //set global variable for attendance status
    let attendanceAction = 'no Action';
    let lessonToCredit = 'no credit added';

    if (didAttend) {
      attendanceAction = await postAttendedLesson(
        receptInitialSale,
        purchaseId
      );
    } else if (!didAttend) {
      attendanceAction = await postAttendedLesson(
        receptInitialSale,
        purchaseId
      );

      lessonToCredit = await postLessonToCredit(purchaseId, lessonPrice);
    }

    // const changeHandledStatus = await setPurchaseHandledToTrue(purchaseId);
    return res.status(200).json({
      attendanceActionStatus: attendanceAction,
      creditStatus: lessonToCredit,
    });
  } catch (err) {
    console.log(
      `There was and error in submitClasslist method. The error is ${err}`
    );
    return res
      .status(400)
      .send(
        `There was and error in submitClasslist method. The error is ${err}`
      );
  }
};

const addToGroupClass = async (req, res) => {
  try {
    const lessonDate = req.params.lessonDate;
    const lessonType = req.params.lessonType;

    const userId = req.body.userId;
    const lessonPrice = req.body.lessonPrice;
    const lessonName = req.body.lessonName;
    const receptInitialPurchase = req.body.receptInitials;

    //body params needed to be added to front-end
    // const receptInitials = req.body.receptInitials;
    // const duration = req.body.duration;

    const duration = 1;

    const currentDate = new Date();

    const addToGroup = await quickAddToGroup(
      userId,
      lessonType,
      lessonDate,
      lessonPrice,
      duration,
      currentDate,
      receptInitialPurchase,
      'Not Paid',
      lessonName
    );

    return res.status(200).json({
      message: `The user: ${userId} was added to ${lessonType}. Lesson is unpaid`,
      purchaseId: addToGroup.purchaseId,
    });
  } catch (err) {
    console.log({
      message: `error in addToGroup method. The error is: ${err}`,
    });
    return res
      .status(404)
      .json({ message: `error in addToGroup method. The error is: ${err}` });
  }
};

const postPrivateAttended = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    // const { userId, lessonName, purchaseId } = req.body;

    //body params needed to be configured on front-end
    const receptInitialSale = req.body.receptInitials;

    const attendedLesson = await postAttendedLesson(
      receptInitialSale,
      purchaseId
    );

    // const changeHandledStatus = await setPurchaseHandledToTrue(purchaseId);

    //  const addSale = await db.query(
    //    `
    // INSERT INTO sales(user_id, type_id, date, recept_initial, purchase_id)
    // VALUES(?,?,?,?,?)`,
    //    [user_id, type_id, scheduleddate, 'MO', purchase_id]
    //  );

    return res.status(200).json(attendedLesson);
  } catch (err) {
    console.log({
      message: `error in postPrivateAttended method. error is: ${err}`,
    });
    return res.status(404).json({
      message: `error in postPrivateAttended method. error is: ${err}`,
    });
  }
};

const undoPrivateAttended = async (req, res) => {
  try {
    const purchaseId = req.params.purchaseId;

    const isCreditAdded = 1;

    const deleteSale = await putDeleteSale(purchaseId);

    //delete any credit transaction involved
    const deleteCredit = await deleteCreditUsed(purchaseId, isCreditAdded);
    // const changeHandledStatus = await setPurchaseHandledToFalse(purchaseId);

    // const undoSale = await db.query(`
    //   DELETE
    //   FROM sales
    //   WHERE purchase_id = ${purchaseId}
    // `);

    // const changeHandledStatus = await db.query(`
    //   UPDATE purchases
    //   SET purchaseHandled = 0
    //   WHERE purchase_id = ${purchaseId}`);

    // console.log(undoSale[0]);
    return res
      .status(200)
      .json(
        `lesson with purchase Id: ${purchaseId} was set back to unattended`
      );
  } catch (err) {
    console.log(`error in deletePrivateAttended method. Error is: ${err}`);
    res
      .status(404)
      .json(`error in deletePrivateAttended method. Error is: ${err}`);
  }
};

const postPrivateNoShow = async (req, res) => {
  try {
    const purchaseId = req.params.purchaseId;

    const lessonPrice = req.body.lessonPrice;
    const attended = req.body.attended;

    const receptInitialSale = req.body.receptInitials;

    const privateNoShow = await postAttendedLesson(
      receptInitialSale,
      purchaseId
    );
    if (lessonPrice) {
      const lessonToCredit = await postLessonToCredit(purchaseId, lessonPrice);
    }

    return res
      .status(200)
      .json(
        `lesson with purchaseId: ${purchaseId} has been changed to attended. ${lessonPrice} was added to credit.`
      );
  } catch (err) {
    console.log(`error is postPrivateNoShow method. Error is: ${err}`);
    return res
      .status(404)
      .json(`error is postPrivateNoShow method. Error is: ${err}`);
  }
};

const getPartnerInfo = async (req, res) => {
  try {
    const partner1Id = req.params.partner1Id;
    const partner2Id = req.params.partner2Id;
    const partner3Id = req.params.partner3Id;

    const partnerInfo = await getPartnerData(
      partner1Id,
      partner2Id,
      partner3Id
    );

    return res.status(200).json(partnerInfo);
  } catch (err) {
    console.log(`error in getPartnerInfo method. the error is: ${err}`);
    res
      .status(400)
      .json(`error in getPartnerInfo method. the error is: ${err}`);
  }
};

module.exports = {
  getLessons,
  getGroupClasslist,
  submitClasslist,
  addToGroupClass,
  postPrivateAttended,
  undoPrivateAttended,
  postPrivateNoShow,
  getPartnerInfo,
};
