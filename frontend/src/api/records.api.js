import api from './axios.js';

export const recordsApi = {
  createRecord: (recordType, data, policeStation, district, role) => {
    return api.post(
      '/records',
      { recordType, data, policeStation, district },
      {
        headers: {
          'x-active-role': role,
          'x-active-station': policeStation,
          'x-active-district': district,
        },
      }
    );
  },

  getRecords: (recordType, role, policeStation, district, search = '') => {
    return api.get('/records', {
      params: { recordType, search },
      headers: {
        'x-active-role': role,
        'x-active-station': policeStation,
        'x-active-district': district,
      },
    });
  },

  getRecord: (id) => {
    return api.get(`/records/${id}`);
  },

  updateRecord: (id, data) => {
    return api.put(`/records/${id}`, { data });
  },

  deleteRecord: (id) => {
    return api.delete(`/records/${id}`);
  },
};
