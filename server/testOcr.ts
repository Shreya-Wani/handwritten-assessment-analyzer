import fs from 'fs';
import path from 'path';
import { processAssessmentFiles } from './src/services/documentProcessingService';
import { assessmentStore } from './src/store/assessmentStore';
import { extractTextFromPage } from './src/services/ocr/ocrService';
import { PROCESSED_DIR } from './src/services/fileService';

(async () => {
  const id = 'test-ocr';
  
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('processed')) fs.mkdirSync('processed');
  
  fs.copyFileSync('../sample_question_paper.pdf', 'uploads/qp-ocr.pdf');
  fs.copyFileSync('../sample_handwritten_answer_sheet.pdf', 'uploads/as-ocr.pdf');
  
  assessmentStore.createAssessment(id, 
    {fileId: 'qp-ocr.pdf', name: 'qp', mimeType: 'application/pdf', size: 100}, 
    {fileId: 'as-ocr.pdf', name: 'as', mimeType: 'application/pdf', size: 100}
  );
  
  try { 
    console.log('Running phase 3...');
    await processAssessmentFiles(id); 
    const result = assessmentStore.getAssessment(id);
    
    console.log('Running phase 4 OCR directly on QP pages...');
    const qpData = result?.processedData?.questionPaper;
    if (!qpData || !qpData.pages) return;

    for (const page of qpData.pages) {
      const imagePath = path.join(PROCESSED_DIR, id, 'questionPaper', page.imageId);
      const pageResult = await extractTextFromPage(imagePath, page.pageNumber, page.width, page.height);
      console.log(`\n--- PAGE ${page.pageNumber} OCR BLOCKS ---`);
      for (const block of pageResult.blocks) {
         console.log(`[Confidence: ${block.confidence}] TEXT: ${JSON.stringify(block.text)}`);
      }
    }
  } catch (e) { 
    console.error('ERROR:', e); 
  }
})();
