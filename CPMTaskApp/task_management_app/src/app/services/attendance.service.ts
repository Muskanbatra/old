import axios from 'axios';

import { API_BASE_URL } from '../api/client';

export const attendanceService = {
  checkIn: (data: any) => {
    return axios.post(
      `${API_BASE_URL}/attendance/checkin`,
      data,
    );
  },

  checkOut: (data: any) => {
    return axios.put(
      `${API_BASE_URL}/attendance/checkout`,
      data,
    );
  },

  getTodayAttendance: () => {
    return axios.get(
      `${API_BASE_URL}/attendance/today`,
    );
  },

  getAttendanceStatus: (userId: any) => {
    return axios.get(
      `${API_BASE_URL}/attendance/status/${userId}`
    );
  },

  getTodayReport: () => {
    return axios.get(
      `${API_BASE_URL}/attendance/today-report`
    );
  },
};
