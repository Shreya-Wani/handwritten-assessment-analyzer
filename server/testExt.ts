import { extractQuestionsForAssessment } from './src/services/questionExtractionService';
import { assessmentStore } from './src/store/assessmentStore';

(async () => {
  try {
    const questions = await extractQuestionsForAssessment('test-ocr-run');
    console.log(JSON.stringify(questions, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
