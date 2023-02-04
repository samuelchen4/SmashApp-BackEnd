const {
  getTrackerData,
  getAmountOwed,
  getLessonsOwed,
  // getUserInfo,
  getCredits,
  changeContactStatus,
  // getOwedLessonsInfo,
  getEveryOverdueLesson,
  changePaidStatus,
} = require('../service/paytracker');

const { postCreditChange, getUnpaidLessons } = require('../service/user');

const payTrackerData = async (req, res) => {
  try {
    const trackerData = await getTrackerData();

    return res.status(200).json(trackerData);
  } catch (err) {
    console.log(err);
    return res.status(404).send(err);
  }
};

const getOverdueLessons = async (req, res) => {
  try {
    const userId = req.params.userId;

    // const userInfo = await getUserInfo(userId);
    const everyOverdueLesson = await getEveryOverdueLesson(userId);
    //lesson types and amount of lessons owed
    const overdueLessons = await getLessonsOwed(userId);

    //amount of money owed
    const amountOwed = await getAmountOwed(userId);

    const credits = await getCredits(userId);

    const unpaidLessons = await getUnpaidLessons(userId);

    // const overdueLessonsInfo = await getOwedLessonsInfo(userId);

    res.status(200).json({
      // userInfo: userInfo,
      lessonInfo: overdueLessons,
      amountOwed,
      everyOverdueLesson,
      // overdueLessonsInfo: overdueLessonsInfo,
      unpaidLessons,
      credits: credits,
    });
  } catch (err) {
    console.log(err);
    res
      .status(404)
      .json(`error with getOverDueLessons method. Error is: ${err}`);
  }
};

const changeContactedStatus = async (req, res) => {
  try {
    const userId = req.params.userId;

    const contactedStatus = req.body.contactedStatus;
    const contactedBy = req.body.contactedBy;

    await changeContactStatus(userId, contactedStatus, contactedBy);
    return res
      .status(200)
      .json(
        `the contactedStatus was changed to ${contactedStatus} for the user: ${userId} `
      );
  } catch (err) {
    console.log(`error in changeContactedStatus method. the error is: ${err}`);
    return res
      .status(400)
      .json(`error in changeContactedStatus method. the error is: ${err}`);
  }
};

const changePayStatus = async (req, res) => {
  try {
    const userId = req.params.userId;

    const receptInitials = req.body.receptInitials;
    const payMethod = req.body.payMethod;
    const overdueLessonArr = req.body.allLessons;
    const creditsUsed = req.body.creditsUsed;
    const invoice = req.body.invoice;

    let payStatusResponses = [];
    let postCreditsUsed = 'No credits used';

    await changeContactStatus(userId, 0, '');

    let purchaseIdArr = [];
    let creditAmount = creditsUsed;
    let i = 0;

    for (const lesson of overdueLessonArr) {
      const purchaseId = lesson.purchase_id;
      const paidStatus = await changePaidStatus(
        purchaseId,
        receptInitials,
        payMethod,
        invoice
      );
      purchaseIdArr.push(purchaseId);
      payStatusResponses.push(paidStatus);
      if (creditAmount) {
        if (creditAmount > lesson.lessonPrice) {
          await postCreditChange(-lesson.lessonPrice, purchaseId);
          creditAmount -= lesson.lessonPrice;
        } else {
          await postCreditChange(-creditAmount, purchaseId);
          creditAmount = 0;
        }
      }
    }

    // await Promise.allSettled(
    //   overdueLessonArr.map(async (lesson, index) => {
    //     const purchaseId = lesson.purchase_id;
    //     const paidStatus = await changePaidStatus(
    //       purchaseId,
    //       receptInitials,
    //       payMethod
    //     );
    //     purchaseIdArr.push(purchaseId);
    //     payStatusResponses.push(paidStatus);
    //     if (creditAmount) {
    //       if (creditAmount > lesson.lessonPrice) {
    //         await postCreditChange(-lesson.lessonPrice, purchaseId);
    //         creditAmount -= lesson.lessonPrice;
    //       } else {
    //         await postCreditChange(-creditAmount, purchaseId);
    //         creditAmount = 0;
    //       }
    //     }
    //   })
    // );

    // overdueLessonArr.map(async (lesson) => {
    //   const purchaseId = lesson.purchase_id;
    //   const paidStatus = await changePaidStatus(
    //     purchaseId,
    //     receptInitials,
    //     payMethod
    //   );
    //   purchaseIdArr.push(purchaseId);
    //   payStatusResponses.push(paidStatus);
    //   if (creditAmount) {
    //     if (creditAmount > lesson.lessonPrice) {
    //       await postCreditChange(-lesson.lessonPrice, purchaseId);
    //       creditAmount -= lesson.lessonPrice;
    //     } else {
    //       await postCreditChange(-creditAmount, purchaseId);
    //       creditAmount = 0;
    //     }
    //   }
    // });

    return res.status(200).json({ payStatusResponses, postCreditsUsed });
  } catch (err) {
    console.log(`error in changePayStatus method. the error is: ${err}`);
    return res.status(400).json({
      message: `error in changePayStatus method. the error is: ${err}`,
    });
  }
};

module.exports = {
  payTrackerData,
  getOverdueLessons,
  changeContactedStatus,
  changePayStatus,
};
