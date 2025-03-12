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
      console.log(`İstek gönderiliyor: ${processType} süreci için`);
      const response = await axios.post(
        `${API_URL}/processes/${processType}/run`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log(`İstek başarıyla gönderildi: ${processType} süreci`);
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
      console.log("İstek gönderiliyor: Kod inceleme süreci için");
      const response = await axios.post(
        `${API_URL}/processes/code_review/run`,  // Updated URL to match backend
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log("İstek başarıyla gönderildi: Kod inceleme süreci");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Code review failed');
    }
  },

  // Yeni eklenen requirement analysis metodu
  async runRequirementAnalysis(files, customPrompt = null) {
    const formData = new FormData();
    files.forEach(file => {
      const actualFile = file.file || file; // Hem { file: FileObject } hem doğrudan File desteklenir
      console.log("Eklenen dosya:", actualFile.name);
      formData.append('files', actualFile);
    });
  
    if (customPrompt) {
      formData.append('customPrompt', customPrompt);
    }
  
    try {
      console.log("İstek gönderiliyor: Gereksinim analizi süreci için");
      const response = await axios.post(
        `${API_URL}/processes/requirement_analysis/run`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log("İstek başarıyla gönderildi: Gereksinim analizi süreci");
      return response.data;
    } catch (error) {
      console.error("Hata detayları:", error.response?.data);
      const errorMsg = error.response?.data?.detail || 'Requirement analysis failed';
      throw new Error(errorMsg);
    }
  }
};