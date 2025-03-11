import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const codeReviewService = {
  async submitForReview(files) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file.file);
    });

    try {
      const response = await axios.post(
        `${API_URL}/processes/code-review`,
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