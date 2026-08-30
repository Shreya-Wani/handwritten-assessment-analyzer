import fs from 'fs';
import path from 'path';
import { processAssessmentFiles } from './src/services/documentProcessingService';
import { assessmentStore } from './src/store/assessmentStore';

(async () => {
  const id = 'test';
  
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('processed')) fs.mkdirSync('processed');
  
  // Write fake original uploaded files
  fs.copyFileSync('../sample_question_paper.pdf', 'uploads/qp');
  fs.copyFileSync('../sample_handwritten_answer_sheet.pdf', 'uploads/as');
  
  assessmentStore.createAssessment(id, 
    {fileId: 'qp', name: 'qp', mimeType: 'application/pdf', size: 100}, 
    {fileId: 'as', name: 'as', mimeType: 'application/pdf', size: 100}
  );
  
  try { 
    await processAssessmentFiles(id); 
    const result = assessmentStore.getAssessment(id);
    console.log('SUCCESS');
    console.log('QP Pages:', result?.processedData?.questionPaper.pages.length);
    console.log('AS Pages:', result?.processedData?.answerSheet.pages.length);
  } catch (e) { 
    console.error('ERROR:', e); 
  }
})();
