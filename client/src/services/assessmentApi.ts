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

/**
 * Triggers Phase 5 handwriting answer extraction.
 */
export async function extractAnswers(assessmentId: string): Promise<any> {
  try {
    const response = await apiClient.post<{ success: true; data: any }>(
      `/api/assessments/${assessmentId}/extract-answers`
    );
    return response.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const serverMessage = axiosErr.response?.data?.message;
    throw new Error(serverMessage ?? 'Answer extraction failed.');
  }
}

/**
 * Triggers Phase 6 deterministic answer mapping.
 */
export async function mapAnswers(assessmentId: string): Promise<any> {
  try {
    const response = await apiClient.post<{ success: true; data: any }>(
      `/api/assessments/${assessmentId}/map-answers`
    );
    return response.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const serverMessage = axiosErr.response?.data?.message;
    throw new Error(serverMessage ?? 'Answer mapping failed.');
  }
}

/**
 * Retrieves the full assessment structure.
 */
export async function getAssessment(assessmentId: string): Promise<any> {
  try {
    const response = await apiClient.get<{ success: true; data: any }>(`/api/assessments/${assessmentId}`);
    return response.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<ApiError>;
    const serverMessage = axiosErr.response?.data?.message;
    throw new Error(serverMessage ?? 'Failed to fetch assessment.');
  }
}

/**
 * Returns the URL for a specific processed page image.
 */
export function getPageImageUrl(assessmentId: string, documentType: 'questionPaper' | 'answerSheet', pageNumber: number): string {
  // Assuming apiClient.defaults.baseURL handles the prefix in some environments,
  // but for an img src, we need the raw URL. If using proxy in Vite, it's just /api/...
  return `/api/assessments/${assessmentId}/pages/${documentType}/${pageNumber}`;
}
