const Attendance =

  require('../models/Attendance');

exports.checkIn = async (req, res) => {

  const record = await Attendance.create(req.body);

  res.send(record);
};

exports.checkOut =

  async (req, res) => {

    const record =

      await Attendance.findOne({

        userId: req.body.userId,

        status: "CHECKED_IN"

      });

    record.checkOutTime =

      req.body.checkOutTime;

    record.checkOutLocation =

      req.body.checkOutLocation;

    record.status =

      "CHECKED_OUT";

    record.totalHours =

      (

        new Date(record.checkOutTime)

        -

        new Date(record.checkInTime)

      )

      /

      (1000 * 60 * 60);

    await record.save();

    res.send(record);

  };

exports.getTodayAttendance = async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const records = await Attendance.find({
    checkInTime: {
      $gte: start,
      $lte: end,
    },
  });

  res.send(records);
};