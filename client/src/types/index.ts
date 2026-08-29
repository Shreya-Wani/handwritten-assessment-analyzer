// ─── Processing pipeline ──────────────────────────────────────────────────────

export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

export interface Question {
  id: string;
  number: string;
  text: string;
  maxMarks: number;
}

export interface AnswerRegion {
  page: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Answer {
  id: string;
  questionId: string;
  studentAnswerText: string;
  marksObtained?: number;
  feedback?: string;
  regions: AnswerRegion[];
}

export interface Assessment {
  id: string;
  title: string;
  status: ProcessingStatus;
  questionPaperUrl?: string;
  answerSheetUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResult {
  assessmentId: string;
  questions: Question[];
  answers: Answer[];
  totalMaxMarks: number;
  totalMarksObtained?: number;
}

// ─── Phase 2: Upload types ────────────────────────────────────────────────────

/** Metadata for a single uploaded file returned by the API. */
export interface UploadedFile {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
}

/** Success response body from POST /api/assessments/upload. */
export interface UploadAssessmentResponse {
  assessmentId: string;
  questionPaper: UploadedFile;
  answerSheet: UploadedFile;
}

/** Union of possible upload UI states. */
export type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error';

/** Error shape returned by the API (matches server UploadErrorResponse). */
export interface ApiError {
  success: false;
  message: string;
  code?: string;
}
