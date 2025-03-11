import axios from 'axios';
import { PROCESS_TYPES } from '../constants/processTypes';

const API_URL = 'http://localhost:8000/api';

export const processService = {
  async runProcess(processType, files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(
        `${API_URL}/processes/${processType}/run`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || `Failed to run ${processType}`);
    }
  },

  async runCodeReview(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file.file); // Access the actual File object
    });

    try {
      const response = await axios.post(
        `${API_URL}/processes/code_review/run`,  // Updated URL to match backend
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Code review failed');
    }
  }
};