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

