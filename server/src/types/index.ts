export type ProcessingStatus = 'uploaded' | 'processing' | 'processed' | 'extracting_questions' | 'questions_extracted' | 'extracting_answers' | 'answers_extracted' | 'mapping_answers' | 'answers_mapped' | 'failed';
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
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StudentAnswer {
  id: string;
  questionNumber: string | null;
  text: string;
  regions: AnswerRegion[];
  page: number; // Starting page
  confidence?: number;
  needsReview?: boolean;
}

export interface QuestionAnswerMapping {
  id: string;
  questionId: string | null;
  answerId: string | null;
  status: 'matched' | 'unanswered' | 'unmatched' | 'conflict' | 'needs_review';
  confidence: number;
  method: 'exact_question_number' | 'normalized_question_number' | 'structural_inference' | 'spatial_context' | 'unmatched' | 'conflict';
  needsReview: boolean;
  candidateAnswerIds?: string[]; // For conflicts
}

export interface MappingSummary {
  totalQuestions: number;
  answered: number;
  unanswered: number;
  unmatchedAnswers: number;
  conflicts: number;
  needsReview: number;
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

export interface QuestionGrade {
  questionId: string;
  marksObtained: number | null;
  maxMarks: number | null;
  feedback?: string;
  graded: boolean;
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
  answers?: StudentAnswer[];
  mappings?: QuestionAnswerMapping[];
  mappingSummary?: MappingSummary;
  grades?: Record<string, QuestionGrade>;
  createdAt: Date;
  updatedAt?: Date;
  error?: string;
}

export interface AssessmentResult {
  assessmentId: string;
  questions: Question[];
  answers: StudentAnswer[];
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
