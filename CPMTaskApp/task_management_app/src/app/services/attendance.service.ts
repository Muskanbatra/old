import axios from 'axios';

const BASE_URL = 'http://10.0.2.2:5002/api/v2';

export const attendanceService = {
  checkIn: (data: any) => {
    return axios.post(
      `${BASE_URL}/attendance/checkin`,

      data,
    );
  },

  checkOut: (data: any) => {
    return axios.put(
      `${BASE_URL}/attendance/checkout`,

      data,
    );
  },
   getTodayAttendance: () => {
    return axios.get(
      `${BASE_URL}/attendance/today`,
    );
  },
};
