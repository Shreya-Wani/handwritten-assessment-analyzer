import { Router } from 'express';
import { uploadFields } from '../middleware/uploadMiddleware';
import { uploadAssessment, processAssessment, extractQuestions, extractAnswers, mapAnswers, getAssessmentById, getPageImage } from '../controllers/assessmentController';

const router = Router();

// Upload route
router.post('/upload', uploadFields, uploadAssessment);

// Process route
router.post('/:assessmentId/process', processAssessment);

// Extract questions route
router.post('/:assessmentId/extract-questions', extractQuestions);

// Extract answers route
router.post('/:assessmentId/extract-answers', extractAnswers);

// Map answers route
router.post('/:assessmentId/map-answers', mapAnswers);

// Get assessment data
router.get('/:assessmentId', getAssessmentById);

// Get specific page image
router.get('/:assessmentId/pages/:documentType/:pageNumber', getPageImage);

export default router;
