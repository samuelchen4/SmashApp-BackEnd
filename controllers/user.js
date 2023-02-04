const mysql = require('../database/database-Connect');
const {
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
  updateUnpaidLessons,
  postAddCredits,
  updateCreditUsed,
  updateCreditAdded,
} = require('../service/user');

const { getCredits, changePaidStatus } = require('../service/paytracker');

const getInfo = async (req, res) => {
  try {
    const userId = req.params.userId;

    //get user info
    const userInfo = await getUserInfo(userId);

    //get purchase log info
    // const purchaseLog = await getPurchaseInfo(userId);

    //get sales log info
    // const salesLog = await getSalesInfo(userId);

    const lessonHistory = await getLessonHistory(userId);

    const unpaidLessons = await getUnpaidLessons(userId);

    //get all lesson types
    const lessonTypes = await getLessonTypes();

    //get credits for user
    const credits = await getCredits(userId);

    //get avaliable lessons for user
    const avaliableLessons = await getAvaliableLessons(userId);

    const users = await getAllUsers();

    return res.status(200).json({
      userId,
      userInfo,
      // purchaseLog,
      // salesLog,
      lessonHistory,
      unpaidLessons,
      lessonTypes,
      credits,
      avaliableLessons,
      users,
    });
  } catch (err) {
    const userId = req.params.userId;
    console.log(
      `this is an error in the getInfo method. The error is: ${err}. The user id is ${userId}`
    );
    res.json(
      `this is an error in the getInfo method. The error is: ${err}. The user id is ${userId}`
    );
  }
};

const buyLesson = async (req, res) => {
  try {
    const userId = req.params.userId;
    // const user_id = req.body.userId;
    const typeId = req.body.lessonId;

    //moved price and lesson name into the purchases table
    //update these values to the database
    const lessonName = req.body.lessonName;
    const priceWithDiscountIncluded = req.body.priceWithDiscountIncluded;

    const discountAmount = req.body.discountAmount / 100;
    const discountNotes = req.body.discountNotes;
    const purchaseLessonDate = req.body.purchaseLessonDate.toLocaleString(
      'en-CA',
      {
        timeZone: 'America/Edmonton',
      }
    );
    const partnerArr = req.body.partnerArr;
    const credit = req.body.credit;
    const payMethod = req.body.payMethod;
    const paidStatus = req.body.paidStatus;
    const receptInitial_purchase = req.body.receptInitials;
    const invoiceNumber = req.body.invoiceNumber;

    const datePurchased = new Date().toLocaleString('en-CA', {
      timeZone: 'America/Edmonton',
    });

    //still need to get these values from frontend

    const duration = 1;

    //store discount and purchasecredits if these things are posted to db
    let discount = 'no discount used';
    let purchaseCredits = 'no purchase credits Used';

    //configure partners for scheduledDates
    let partnerIds = [0, 0, 0];
    let partnerResponseInfo = [{}, {}, {}];

    if (partnerArr.length) {
      partnerArr.forEach((partner, index) => {
        partnerIds[index] = partner.value;
      });
    }

    // let partnerId1 = partnerIds[0];
    // let partnerId2 = partnerIds[1];
    // let partnerId3 = partnerIds[2];

    const purchase = await postPurchase(
      userId,
      typeId,
      payMethod,
      datePurchased,
      receptInitial_purchase,
      paidStatus,
      lessonName,
      priceWithDiscountIncluded,
      invoiceNumber
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

    if (discountAmount) {
      discount = await postDiscounts(purchaseId, discountAmount, discountNotes);
    }

    if (credit) {
      purchaseCredits = await postPurchaseCredits(credit, purchaseId);
    }

    //post partners
    if (partnerArr.length) {
      await Promise.all(
        partnerIds.map(async (partnerId, index) => {
          if (partnerId) {
            const newUserId = partnerId;
            let modifiedPartnerIds = partnerIds.slice(0);
            partnerResponseInfo[index].purchase = await postPurchase(
              newUserId,
              typeId,
              'Not Paid',
              datePurchased,
              receptInitial_purchase,
              0,
              lessonName,
              priceWithDiscountIncluded / (1 - discountAmount)
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

            // if (discountAmount) {
            //   partnerResponseInfo[index].discount = await postDiscounts(
            //     partnerPurchaseId,
            //     discountAmount,
            //     discountNotes
            //   );
            // }
          }
        })
      );
    }

    return res.status(200).json({
      purchase,
      purchaseId,
      scheduledDate,
      discount,
      purchaseCredits,
      purchaseLessonDate,
      credit,
      payMethod,
      partnerInfo: partnerResponseInfo,
      partnerIds,
      // modifiedPartnerIds,
    });

    // res.status(200).json({
    // purchase_id,
    // discount: discountAmount ? 'discount applied' : 'no discount applied',
    // scheduleddate,
    // purchaseCredit: credit
    //     ? `${credit} deducted from user`
    //     : 'no credit used',
    // });
    //create purchases for partners
  } catch (err) {
    console.log(err);
    return res
      .status(404)
      .send(`error in postPurchases method. the error is ${err}`);
  }
};

const updateInfo = async (req, res) => {
  try {
    const userId = req.params.userId;

    const fn = req.body.fn;
    const ln = req.body.ln;
    const phone = req.body.phone;
    const email = req.body.email;
    const dob = req.body.dob;
    const cgStatus = req.body.cgStatus;
    const medicalDesc = req.body.medicalDesc;
    // const dob = '1998-02-11';
    const creditChange = req.body.creditChange;
    const receptInitials = req.body.receptInitials;
    const todaysDate = req.body.purchaseDate;
    const invoiceNumber = req.body.invoiceNumber;

    //set default isCreditAdded status
    let updateCreditChange = `No credit change`;
    let isCreditAdded = 1;

    const updateUser = await updateUserInfoOnDb(
      userId,
      fn,
      ln,
      phone,
      email,
      dob,
      cgStatus,
      medicalDesc
    );

    if (creditChange) {
      let logCredit;
      if (creditChange > 0) {
        logCredit = await postPurchaseAll(
          userId,
          1,
          'Add Credit',
          todaysDate,
          receptInitials,
          1,
          1,
          1,
          'Add Credit',
          0,
          receptInitials,
          invoiceNumber
        );
      } else {
        logCredit = await postPurchaseAll(
          userId,
          1,
          'Remove Credit',
          todaysDate,
          receptInitials,
          1,
          1,
          1,
          'Remove Credit',
          0,
          receptInitials,
          invoiceNumber
        );
      }

      const purchaseId = logCredit.purchaseId;

      if (creditChange < 0) {
        updateCreditChange = await postPurchaseCredits(
          -creditChange,
          purchaseId
        );
      } else {
        updateCreditChange = await postAddCredits(creditChange, purchaseId);
      }
    }

    return res.status(200).json({
      message: `user info for userId:${userId} was changed`,
      info: updateUser,
      updateCreditChange,
      creditChange,
    });
  } catch (err) {
    return res
      .status(404)
      .json(`error in updateInfo method. the error is ${err}`);
  }
};

const payUnpaidLessons = async (req, res) => {
  try {
    const purchaseId = req.body.purchaseId;
    const payMethod = req.body.payMethod;
    const receptInitials = req.body.receptInitials;
    const newLessonPrice = req.body.newLessonPrice;
    const discountAmount = req.body.discountAmount;
    const discountNotes = req.body.discountNotes;

    let discountStatus = 'no discount applied';

    const paidStatus = await updateUnpaidLessons(
      purchaseId,
      receptInitials,
      payMethod,
      newLessonPrice
    );

    if (discountAmount) {
      discountStatus = await postDiscounts(
        purchaseId,
        discountAmount,
        discountNotes
      );
    }

    return res.status(200).json({ paidStatus, discountStatus });
  } catch (err) {
    return res
      .status(400)
      .send(`error in payUnpaidLessons method. The error is: ${err}`);
  }
};

module.exports = {
  getInfo,
  buyLesson,
  updateInfo,
  payUnpaidLessons,
};
