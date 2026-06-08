const router =
  require('express').Router();

const controller =

  require(
    '../controllers/attendance.controller'
  );

router.post(
  '/checkin',
  controller.checkIn
);

router.put(
  '/checkout',
  controller.checkOut
);
router.get(
  '/today',
  controller.getTodayAttendance
);

module.exports = router;