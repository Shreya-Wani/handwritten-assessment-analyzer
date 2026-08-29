import { createWorker } from 'tesseract.js';
import { OCRPageResult, OCRBlock, BoundingBox } from './ocrTypes';

export async function extractTextFromPage(
  imagePath: string,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number
): Promise<OCRPageResult> {
  const worker = await createWorker('eng');
  
  try {
    const { data } = await worker.recognize(imagePath);
    
    const blocks: OCRBlock[] = [];

    // Tesseract v5 nests lines inside blocks -> paragraphs
    const lines = data.blocks
      ? data.blocks.flatMap(b => b.paragraphs.flatMap(p => p.lines))
      : [];

    for (const line of lines) {
      if (!line || !line.text || !line.text.trim()) continue;

      const bbox = line.bbox; // { x0, y0, x1, y1 }
      const boundingBox: BoundingBox = {
        x: bbox.x0,
        y: bbox.y0,
        width: bbox.x1 - bbox.x0,
        height: bbox.y1 - bbox.y0
      };

      blocks.push({
        text: line.text.trim(),
        confidence: line.confidence,
        boundingBox,
        pageNumber
      });
    }

    return {
      pageNumber,
      width: pageWidth,
      height: pageHeight,
      blocks
    };
  } finally {
    await worker.terminate();
  }
}
