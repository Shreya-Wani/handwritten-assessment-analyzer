import { extractTextFromPage as tesseractExtract } from './tesseractService';
import { OCRPageResult } from './ocrTypes';

/**
 * Extracts handwritten text and bounding boxes from a given answer sheet page image.
 * This abstracts the underlying handwriting OCR implementation.
 * Currently uses Tesseract.js (LSTM), which is completely local but may have 
 * accuracy limitations on cursive handwriting compared to cloud Vision APIs.
 * 
 * If a custom Python worker (e.g. TrOCR, PaddleOCR) is needed in the future for 
 * vastly superior handwriting recognition, it should replace the implementation here.
 */
export async function extractHandwritingFromPage(
  imagePath: string,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number
): Promise<OCRPageResult> {
  // We reuse the local Tesseract worker as it fulfills the "no paid API" 
  // and "local execution" requirements.
  return tesseractExtract(imagePath, pageNumber, pageWidth, pageHeight);
}
