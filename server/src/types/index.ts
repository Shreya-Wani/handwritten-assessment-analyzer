export type ProcessingStatus = 'uploaded' | 'processing' | 'processed' | 'extracting_questions' | 'questions_extracted' | 'failed';
export type DocumentType = 'questionPaper' | 'answerSheet';

export interface QuestionRegion {
  page: number; // 1-indexed
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Question {
  id: string;
  number: string; // original printed numbering e.g. "1", "2(a)", "2(b)"
  text: string;
  page: number; // The starting page of the question
  regions: QuestionRegion[];
  maxMarks?: number;
  confidence?: number;
  needsReview?: boolean;
}

export interface AnswerRegion {
  page: number; // 1-indexed
  boundingBox: {
    x: number;      // normalised 0–1
    y: number;      // normalised 0–1
    width: number;  // normalised 0–1
    height: number; // normalised 0–1
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

export interface ProcessedPage {
  pageNumber: number;
  width: number;
  height: number;
  imageId: string;
  documentType: DocumentType;
}

export interface ProcessedDocument {
  documentType: DocumentType;
  totalPages: number;
  pages: ProcessedPage[];
}

export interface Assessment {
  id: string;
  title?: string;
  status: ProcessingStatus;
  questionPaper: UploadedFile;
  answerSheet: UploadedFile;
  processedData?: {
    questionPaper?: ProcessedDocument;
    answerSheet?: ProcessedDocument;
  };
  questions?: Question[];
  createdAt: Date;
  updatedAt?: Date;
  error?: string;
}

export interface AssessmentResult {
  assessmentId: string;
  questions: Question[];
  answers: Answer[];
  totalMaxMarks: number;
  totalMarksObtained?: number;
}

// ─── Phase 2: Upload types ────────────────────────────────────────────────────

/**
 * Metadata about a single successfully uploaded file.
 * Filesystem paths are intentionally excluded; only safe identifiers are exposed.
 */
export interface UploadedFile {
  /** Randomly generated identifier used as the stored filename (no extension collision). */
  fileId: string;
  /** The original filename the client sent (sanitised for display only). */
  originalName: string;
  /** Validated MIME type. */
  mimeType: string;
  /** File size in bytes. */
  size: number;
}

/** Full structured response returned by POST /api/assessments/upload. */
export interface UploadAssessmentResponse {
  assessmentId: string;
  questionPaper: UploadedFile;
  answerSheet: UploadedFile;
}

/** Shape of the error body sent to the client on upload failure. */
export interface UploadErrorResponse {
  success: false;
  message: string;
  code?: string;
}
