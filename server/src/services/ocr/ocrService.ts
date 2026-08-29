// OCR Service boundary
import { extractTextFromPage as tesseractExtract } from './tesseractService';
import { OCRPageResult } from './ocrTypes';

/**
 * Extracts text and bounding boxes from a given page image.
 * This abstracts the underlying OCR implementation (currently Tesseract.js)
 * to allow seamless swapping to PaddleOCR or other engines in the future.
 */
export async function extractTextFromPage(
  imagePath: string,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number
): Promise<OCRPageResult> {
  return tesseractExtract(imagePath, pageNumber, pageWidth, pageHeight);
}
