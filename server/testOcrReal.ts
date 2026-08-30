import fs from 'fs';
import path from 'path';
import { processAssessmentFiles } from './src/services/documentProcessingService';
import { assessmentStore } from './src/store/assessmentStore';
import { extractTextFromPage } from './src/services/ocr/ocrService';
import { PROCESSED_DIR } from './src/services/fileService';

(async () => {
  const id = 'test-ocr-run';
  
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  if (!fs.existsSync('processed')) fs.mkdirSync('processed');
  
  // Create an assessment using the files currently in uploads directory
  assessmentStore.createAssessment(id, 
    {fileId: 'e48e240b-e973-4c5d-8c26-9ddafdbd472a.pdf', name: 'qp', mimeType: 'application/pdf', size: 2208}, 
    {fileId: '5a229c6d-4b35-475c-9e7b-27d1ba5d1250.pdf', name: 'as', mimeType: 'application/pdf', size: 46911}
  );
  
  try { 
    console.log('Running phase 3...');
    await processAssessmentFiles(id); 
    const result = assessmentStore.getAssessment(id);
    
    console.log('Running OCR on QP...');
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
