const express = require('express');
const router = express.Router();

const {
  getLessons,
  getGroupClasslist,
  submitClasslist,
  addToGroupClass,
  postPrivateAttended,
  undoPrivateAttended,
  postPrivateNoShow,
  getPartnerInfo,
} = require('../controllers/agenda');

router.get('/:lessonDate', getLessons);
router.get('/group/classlist/:lessonType/:lessonDate', getGroupClasslist);
router.put('/group/classlist/:purchaseId/submit', submitClasslist);
router.post('/group/classlist/:lessonType/:lessonDate/add', addToGroupClass);
router.put('/private/:purchaseId/attended', postPrivateAttended);
router.put('/private/:purchaseId/toCredit', postPrivateNoShow);
router.put('/private/:purchaseId/undoSale', undoPrivateAttended);
router.get(
  '/private/partnerInfo/:partner1Id/:partner2Id/:partner3Id',
  getPartnerInfo
);

module.exports = router;
