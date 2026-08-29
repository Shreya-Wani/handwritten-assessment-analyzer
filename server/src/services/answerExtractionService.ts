import path from 'path';
import { assessmentStore } from '../store/assessmentStore';
import { extractHandwritingFromPage } from './ocr/handwritingOcrService';
import { PROCESSED_DIR } from './fileService';
import { StudentAnswer, AnswerRegion } from '../types';
import { OCRBlock } from './ocr/ocrTypes';

// Regex to identify handwriting question references
// Examples matched: "Q1", "Q.1", "1", "1.", "Q2(a)", "2(a)", "11 (b)", "Ans 3"
// Captures major number in group 1, minor subpart in group 2
const ANSWER_START_REGEX = /^\s*(?:Q(?:ues)?|A(?:ns)?|Sol(?:ution)?)?\.?\s*(\d+)\s*[\.\-\)]?\s*(?:\(\s*([a-zA-Z])\s*\))?/i;

// Clamp function to ensure coordinates never exceed Phase 3 page boundaries
function clampRegion(x: number, y: number, w: number, h: number, pageW: number, pageH: number): AnswerRegion {
  const cx = Math.max(0, Math.min(x, pageW));
  const cy = Math.max(0, Math.min(y, pageH));
  const cw = Math.min(w, Math.max(0, pageW - cx));
  const ch = Math.min(h, Math.max(0, pageH - cy));
  return { page: 0, x: cx, y: cy, width: Math.max(1, cw), height: Math.max(1, ch) };
}

export async function extractAnswersForAssessment(assessmentId: string): Promise<StudentAnswer[]> {
  const assessment = assessmentStore.getAssessment(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  // Allow proceeding if processing completed, or questions extracted.
  if (
    assessment.status !== 'processed' && 
    assessment.status !== 'questions_extracted' &&
    assessment.status !== 'extracting_answers' &&
    assessment.status !== 'answers_extracted'
  ) {
    throw new Error('Phase 3 document processing must be completed before extracting answers');
  }

  assessmentStore.updateStatus(assessmentId, 'extracting_answers');

  try {
    const asData = assessment.processedData?.answerSheet;
    if (!asData || !asData.pages || asData.pages.length === 0) {
      throw new Error('No processed answer sheet pages found');
    }

    const allBlocks: OCRBlock[] = [];

    // 1. Run Handwriting OCR on all pages sequentially
    for (const page of asData.pages) {
      const imagePath = path.join(PROCESSED_DIR, assessmentId, 'answerSheet', page.imageId);
      const pageResult = await extractHandwritingFromPage(imagePath, page.pageNumber, page.width, page.height);
      
      // Inject clamped boundaries into the blocks for downstream parser
      for (const block of pageResult.blocks) {
        const clamped = clampRegion(
          block.boundingBox.x, block.boundingBox.y, 
          block.boundingBox.width, block.boundingBox.height, 
          page.width, page.height
        );
        block.boundingBox.x = clamped.x;
        block.boundingBox.y = clamped.y;
        block.boundingBox.width = clamped.width;
        block.boundingBox.height = clamped.height;
      }
      
      allBlocks.push(...pageResult.blocks);
    }

    // 2. Parse handwriting blocks into structured answers
    const answers = parseOCRBlocksToAnswers(allBlocks);

    // 3. Store result in assessment
    assessment.answers = answers;
    assessmentStore.updateStatus(assessmentId, 'answers_extracted');

    return answers;
  } catch (error: any) {
    assessmentStore.updateStatus(assessmentId, 'failed', error.message);
    throw error;
  }
}

function parseOCRBlocksToAnswers(blocks: OCRBlock[]): StudentAnswer[] {
  const answers: StudentAnswer[] = [];
  let currentAnswer: StudentAnswer | null = null;
  let lastMajorNumber: string = '';

  for (const block of blocks) {
    const text = block.text.trim();
    if (!text) continue; // Skip empty blocks but preserve spatial regions if diagrams needed? 
    // Wait, the prompt says diagrams might have no text. Tesseract usually doesn't return blocks for pure images, 
    // but if it does, we should keep it. Tesseract omits empty lines, so we might lose diagrams without layout analysis.
    // For this implementation, we focus on text blocks as provided by Tesseract.

    const match = text.match(ANSWER_START_REGEX);
    let isNewAnswer = false;
    let extractedQuestionRef: string | null = null;

    if (match && (match[1] || match[2])) {
      const majorNum = match[1]; // e.g. "2"
      const minorNum = match[2]; // e.g. "a"

      if (majorNum) {
        lastMajorNumber = majorNum;
      }

      if (minorNum) {
        extractedQuestionRef = `${lastMajorNumber ? lastMajorNumber : ''}(${minorNum})`;
      } else {
        extractedQuestionRef = lastMajorNumber;
      }

      isNewAnswer = true;
    }

    // If we have a new answer reference OR we don't have a current answer yet (anonymous start)
    if (isNewAnswer || !currentAnswer) {
      let cleanText = text;

      if (isNewAnswer && extractedQuestionRef && match) {
        // Strip the reference from text
        cleanText = cleanText.slice(match[0].length).trim();
      }

      const newA: StudentAnswer = {
        id: `ans-${(extractedQuestionRef || 'anon').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 6)}`,
        questionNumber: isNewAnswer ? extractedQuestionRef : null,
        text: cleanText,
        page: block.pageNumber,
        regions: [{
          page: block.pageNumber,
          x: block.boundingBox.x,
          y: block.boundingBox.y,
          width: block.boundingBox.width,
          height: block.boundingBox.height
        }],
        confidence: block.confidence,
        needsReview: block.confidence < 75 || (!isNewAnswer)
      };

      answers.push(newA);
      currentAnswer = newA;
    } else {
      // Continuation of current answer
      if (text) {
        currentAnswer.text = currentAnswer.text ? `${currentAnswer.text} ${text}` : text;
      }

      if (currentAnswer.confidence !== undefined) {
        currentAnswer.confidence = Math.min(currentAnswer.confidence, block.confidence);
        if (currentAnswer.confidence < 75) {
          currentAnswer.needsReview = true;
        }
      }

      // Preserve individual regions for highlighting
      currentAnswer.regions.push({
        page: block.pageNumber,
        x: block.boundingBox.x,
        y: block.boundingBox.y,
        width: block.boundingBox.width,
        height: block.boundingBox.height
      });
    }
  }

  return answers;
}
