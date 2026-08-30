import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import { PROCESSED_DIR } from './src/services/fileService';

(async () => {
  const imagePath = path.join(PROCESSED_DIR, 'test-ocr-run', 'questionPaper', 'page-1.png');
  console.log('Running tesseract on', imagePath);
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(imagePath);
    console.log('RAW TEXT:', data.text);
    console.log('BLOCKS COUNT:', data.blocks ? data.blocks.length : 0);
    console.log('LINES COUNT:', data.lines ? data.lines.length : 0);
  } finally {
    await worker.terminate();
  }
})();
