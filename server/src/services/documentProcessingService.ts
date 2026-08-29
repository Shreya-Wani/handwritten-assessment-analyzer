import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Canvas } from 'skia-canvas';
import { assessmentStore } from '../store/assessmentStore';
import { Assessment, ProcessedDocument, ProcessedPage, DocumentType } from '../types';
import { UPLOADS_DIR } from '../config/constants';
import { ensureProcessedDir } from './fileService';

/**
 * Main orchestrator for document processing.
 */
export const processAssessmentFiles = async (assessmentId: string): Promise<Assessment> => {
  const assessment = assessmentStore.getAssessment(assessmentId);
  
  if (!assessment) {
    throw new Error('Assessment not found in store.');
  }

  // Update state to processing
  assessmentStore.updateStatus(assessmentId, 'processing');

  try {
    const qpPath = path.join(UPLOADS_DIR, path.basename(assessment.questionPaper.fileId));
    const asPath = path.join(UPLOADS_DIR, path.basename(assessment.answerSheet.fileId));

    if (!fs.existsSync(qpPath) || !fs.existsSync(asPath)) {
      throw new Error('Original uploaded files are missing from disk.');
    }

    // Process Question Paper
    const qpData = await processDocument(
      qpPath,
      assessment.questionPaper.mimeType,
      'questionPaper',
      assessmentId
    );
    assessmentStore.updateProcessedData(assessmentId, 'questionPaper', qpData);

    // Process Answer Sheet
    const asData = await processDocument(
      asPath,
      assessment.answerSheet.mimeType,
      'answerSheet',
      assessmentId
    );
    assessmentStore.updateProcessedData(assessmentId, 'answerSheet', asData);

    // Update state to processed
    return assessmentStore.updateStatus(assessmentId, 'processed')!;
  } catch (error: any) {
    assessmentStore.updateStatus(assessmentId, 'failed', error.message);
    throw error;
  }
};

/**
 * Routes the file to the correct processing function based on mimeType.
 */
async function processDocument(
  filePath: string,
  mimeType: string,
  docType: DocumentType,
  assessmentId: string
): Promise<ProcessedDocument> {
  const isPdf = mimeType === 'application/pdf';

  if (isPdf) {
    return processPdf(filePath, docType, assessmentId);
  } else {
    return processImage(filePath, docType, assessmentId);
  }
}

/**
 * Processes a PDF by rendering each page to a PNG using pdfjs-dist + skia-canvas.
 */
async function processPdf(
  filePath: string,
  docType: DocumentType,
  assessmentId: string
): Promise<ProcessedDocument> {
  const outDir = ensureProcessedDir(assessmentId, docType);
  
  // Use dynamic import for ESM-only pdfjs-dist
  const pdfjsLib = await eval('import("pdfjs-dist/legacy/build/pdf.mjs")');
  
  const data = new Uint8Array(fs.readFileSync(filePath));
  
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    standardFontDataUrl: path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts/')
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const pages: ProcessedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    // Use scale 2.5 for high-quality OCR resolution (A4 width -> ~1500px)
    const viewport = page.getViewport({ scale: 2.5 });

    const canvas = new Canvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({
      canvasContext: ctx as any,
      viewport: viewport
    }).promise;

    // Save as standard PNG
    const buffer = await canvas.toBuffer('png');
    const imageId = `page-${i}.png`;
    const outPath = path.join(outDir, imageId);
    
    // Pass through sharp for normalization (strip metadata, exact format)
    const { width, height } = await sharp(buffer)
      .png()
      .toFile(outPath)
      .then(() => sharp(outPath).metadata());

    pages.push({
      pageNumber: i,
      width: width!,
      height: height!,
      imageId,
      documentType: docType
    });
  }

  return {
    documentType: docType,
    totalPages: numPages,
    pages
  };
}

/**
 * Processes a single image file (PNG/JPG) using sharp to normalize orientation and format.
 */
async function processImage(
  filePath: string,
  docType: DocumentType,
  assessmentId: string
): Promise<ProcessedDocument> {
  const outDir = ensureProcessedDir(assessmentId, docType);
  const imageId = 'page-1.png';
  const outPath = path.join(outDir, imageId);

  // Normalize image using sharp (auto-rotate based on EXIF, convert to clean PNG)
  await sharp(filePath)
    .rotate() // auto-rotates based on EXIF
    .png()
    .toFile(outPath);

  const { width, height } = await sharp(outPath).metadata();

  return {
    documentType: docType,
    totalPages: 1,
    pages: [{
      pageNumber: 1,
      width: width!,
      height: height!,
      imageId,
      documentType: docType
    }]
  };
}
