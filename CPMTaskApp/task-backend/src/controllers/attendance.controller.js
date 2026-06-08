const Attendance =

  require('../models/Attendance');

exports.checkIn =

  async (req, res) => {

    const record =

      await Attendance.create(
        req.body
      );

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