import { Router } from 'express';
import { uploadFields } from '../middleware/uploadMiddleware';
import { uploadAssessment, processAssessment, extractQuestions } from '../controllers/assessmentController';

const router = Router();

// Upload route
router.post('/upload', uploadFields, uploadAssessment);

// Process route
router.post('/:assessmentId/process', processAssessment);

// Extract questions route
router.post('/:assessmentId/extract-questions', extractQuestions);

export default router;
