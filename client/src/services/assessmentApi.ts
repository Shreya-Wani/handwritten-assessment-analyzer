import axios, { AxiosError } from 'axios';
import type { UploadAssessmentResponse, ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const apiClient = axios.create({
  baseURL: BASE_URL,
});

/**
 * Uploads both assessment files to the backend in a single multipart request.
 */
export async function uploadAssessmentFiles(
  questionPaper: File,
  answerSheet: File,
  onUploadProgress?: (percent: number) => void,
): Promise<UploadAssessmentResponse> {
  const formData = new FormData();
  formData.append('questionPaper', questionPaper);
  formData.append('answerSheet', answerSheet);

  try {
    const response = await apiClient.post<{
      success: true;
      message: string;
      data: UploadAssessmentResponse;
    }>('/api/assessments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onUploadProgress(percent);
        }
      },
    });

    return response.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const serverMessage = axiosErr.response?.data?.message;

    throw new Error(
      serverMessage ?? 'Upload failed. Please try again.',
    );
  }
}

/**
 * Triggers Phase 3 document processing for an uploaded assessment.
 * @param assessmentId The UUID returned from the upload step.
 */
export async function processAssessment(assessmentId: string): Promise<any> {
  try {
    const response = await apiClient.post<{ success: true; data: any }>(
      `/api/assessments/${assessmentId}/process`
    );
    return response.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const serverMessage = axiosErr.response?.data?.message;
    throw new Error(serverMessage ?? 'Processing failed.');
  }
}

/**
 * Triggers Phase 4 printed question extraction.
 */
export async function extractQuestions(assessmentId: string): Promise<any> {
  try {
    const response = await apiClient.post<{ success: true; data: any }>(
      `/api/assessments/${assessmentId}/extract-questions`
    );
    return response.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const serverMessage = axiosErr.response?.data?.message;
    throw new Error(serverMessage ?? 'Question extraction failed.');
  }
}
