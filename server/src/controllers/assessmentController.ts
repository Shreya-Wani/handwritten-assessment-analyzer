import { Request, Response } from 'express';
import crypto from 'crypto';
import { UploadedFile, UploadAssessmentResponse, UploadErrorResponse } from '../types';
import { buildFileMetadata, extractFileId } from '../services/fileService';
import { assessmentStore } from '../store/assessmentStore';
import { processAssessmentFiles } from '../services/documentProcessingService';

/**
 * Handle POST /upload
 * Expects 'questionPaper' and 'answerSheet' fields with one file each.
 */
export const uploadAssessment = (
  req: Request,
  res: Response
) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files || !files.questionPaper || !files.answerSheet) {
      return res.status(400).json({
        success: false,
        message: 'Both questionPaper and answerSheet files are required.',
        code: 'MISSING_FILES',
      });
    }

    const questionPaperFile = files.questionPaper[0];
    const answerSheetFile = files.answerSheet[0];

    const qpFileId = extractFileId(questionPaperFile.filename);
    const asFileId = extractFileId(answerSheetFile.filename);

    const assessmentId = crypto.randomUUID();

    // Map Multer files to our UploadedFile type
    const qpMetadata: UploadedFile = buildFileMetadata(questionPaperFile, qpFileId);
    const asMetadata: UploadedFile = buildFileMetadata(answerSheetFile, asFileId);

    // Save to in-memory store
    assessmentStore.createAssessment(assessmentId, qpMetadata, asMetadata);

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        assessmentId,
        questionPaper: qpMetadata,
        answerSheet: asMetadata,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Handle POST /:assessmentId/process
 * Processes the previously uploaded assessment files.
 */
export const processAssessment = async (req: Request, res: Response) => {
  const { assessmentId } = req.params;

  const assessment = assessmentStore.getAssessment(assessmentId);
  if (!assessment) {
    return res.status(404).json({
      success: false,
      message: 'Assessment not found.',
      code: 'NOT_FOUND'
    });
  }

  if (assessment.status === 'processing') {
    return res.status(400).json({
      success: false,
      message: 'Assessment is already processing.',
      code: 'DUPLICATE_PROCESSING'
    });
  }
  
  if (assessment.status === 'processed') {
    return res.status(200).json({
      success: true,
      message: 'Documents already processed.',
      data: {
        assessmentId: assessment.id,
        status: assessment.status,
        questionPaper: assessment.processedData?.questionPaper,
        answerSheet: assessment.processedData?.answerSheet,
      }
    });
  }

  try {
    // We let this run asynchronously, but wait for it in this controller to return the full result.
    // In a real system, this would be a background job. But Phase 3 asks for response.
    const result = await processAssessmentFiles(assessmentId);
    
    return res.status(200).json({
      success: true,
      message: 'Documents processed successfully',
      data: {
        assessmentId: result.id,
        status: result.status,
        questionPaper: result.processedData?.questionPaper,
        answerSheet: result.processedData?.answerSheet
      }
    });
  } catch (error: any) {
    console.error(`Error processing assessment ${assessmentId}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Processing failed.',
      code: 'PROCESSING_ERROR'
    });
  }
};

/**
 * Handle POST /:assessmentId/extract-questions
 * Extracts printed questions using OCR and structural parsing.
 */
export const extractQuestions = async (req: Request, res: Response) => {
  const { assessmentId } = req.params;

  try {
    const { extractQuestionsForAssessment } = await import('../services/questionExtractionService');
    const questions = await extractQuestionsForAssessment(assessmentId);
    
    return res.status(200).json({
      success: true,
      message: 'Questions extracted successfully',
      data: {
        assessmentId,
        questions
      }
    });
  } catch (error: any) {
    console.error(`Error extracting questions for ${assessmentId}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Extraction failed.',
      code: 'EXTRACTION_ERROR'
    });
  }
};

/**
 * Handle POST /:assessmentId/extract-answers
 * Extracts handwritten answers using OCR and parses references.
 */
export const extractAnswers = async (req: Request, res: Response) => {
  const { assessmentId } = req.params;

  try {
    const { extractAnswersForAssessment } = await import('../services/answerExtractionService');
    const answers = await extractAnswersForAssessment(assessmentId);
    
    return res.status(200).json({
      success: true,
      message: 'Answers extracted successfully',
      data: {
        assessmentId,
        answers
      }
    });
  } catch (error: any) {
    console.error(`Error extracting answers for ${assessmentId}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Answer extraction failed.',
      code: 'EXTRACTION_ERROR'
    });
  }
};

/**
 * Handle POST /:assessmentId/map-answers
 * Maps extracted handwritten answers to printed questions deterministic rules.
 */
export const mapAnswers = async (req: Request, res: Response) => {
  const { assessmentId } = req.params;

  try {
    const { mapAnswersToQuestions } = await import('../services/answerMappingService');
    const { mappings, summary } = mapAnswersToQuestions(assessmentId);
    
    return res.status(200).json({
      success: true,
      message: 'Answers mapped successfully',
      data: {
        assessmentId,
        summary,
        mappings
      }
    });
  } catch (error: any) {
    console.error(`Error mapping answers for ${assessmentId}:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Mapping failed.',
      code: 'MAPPING_ERROR'
    });
  }
};

/**
 * Handle GET /:assessmentId
 * Returns the full structured assessment data.
 */
export const getAssessmentById = (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const assessment = assessmentStore.getAssessment(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    return res.status(200).json({ success: true, data: assessment });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle GET /:assessmentId/pages/:documentType/:pageNumber
 * Serves processed PNG images securely.
 */
export const getPageImage = (req: Request, res: Response) => {
  try {
    const { assessmentId, documentType, pageNumber } = req.params;
    
    if (documentType !== 'questionPaper' && documentType !== 'answerSheet') {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    const assessment = assessmentStore.getAssessment(assessmentId);
    if (!assessment || !assessment.processedData) {
      return res.status(404).json({ success: false, message: 'Assessment or processed data not found' });
    }

    const docData = assessment.processedData[documentType];
    if (!docData || !docData.pages) {
      return res.status(404).json({ success: false, message: 'Pages not found for document' });
    }

    const pageNum = parseInt(pageNumber, 10);
    const page = docData.pages.find(p => p.pageNumber === pageNum);

    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const { PROCESSED_DIR } = require('../services/fileService');
    const path = require('path');
    
    // Construct path securely using the known metadata id
    const imagePath = path.join(PROCESSED_DIR, assessmentId, documentType, page.imageId);

    // Prevent path traversal
    if (!imagePath.startsWith(path.resolve(PROCESSED_DIR))) {
      return res.status(403).json({ success: false, message: 'Invalid path' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.sendFile(imagePath);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handle PATCH /:assessmentId/questions/:questionId/grade
 * Manually sets a grade for a mapped question.
 */
export const gradeQuestion = (req: Request, res: Response) => {
  try {
    const { assessmentId, questionId } = req.params;
    const { marksObtained, feedback } = req.body;

    const assessment = assessmentStore.getAssessment(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const question = assessment.questions?.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found in assessment' });
    }

    // Validate marks
    let graded = false;
    let validatedMarks: number | null = null;
    
    if (marksObtained !== undefined && marksObtained !== null) {
      const parsed = Number(marksObtained);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ success: false, message: 'Marks must be a positive number' });
      }
      if (question.maxMarks !== undefined && parsed > question.maxMarks) {
        return res.status(400).json({ success: false, message: `Marks cannot exceed maximum of ${question.maxMarks}` });
      }
      validatedMarks = parsed;
      graded = true;
    }

    // Store the grade
    assessmentStore.setQuestionGrade(assessmentId, questionId, {
      marksObtained: validatedMarks,
      maxMarks: question.maxMarks ?? null,
      feedback: feedback || '',
      graded
    });

    return res.status(200).json({
      success: true,
      message: 'Grade saved successfully',
      data: assessment.grades![questionId]
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

