import path from 'path';
import { assessmentStore } from '../store/assessmentStore';
import { extractTextFromPage } from './ocr/ocrService';
import { PROCESSED_DIR } from './fileService';
import { Question, QuestionRegion } from '../types';
import { OCRBlock } from './ocr/ocrTypes';

// Regex to identify question starts (e.g., "1.", "1(a)", "(a)")
// It handles potential OCR noise like extra spaces.
const QUESTION_START_REGEX = /^\s*(?:Q\.?)?\s*(\d+)?\s*\.?\s*(?:\(\s*([a-zA-Z])\s*\))?/i;
const MARKS_REGEX = /(?:\[\s*(\d+)\s*\]|\(\s*(\d+)\s*(?:marks?|m)\s*\))\s*$/i;

export async function extractQuestionsForAssessment(assessmentId: string): Promise<Question[]> {
  const assessment = assessmentStore.getAssessment(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }
  
  if (assessment.status !== 'processed' && assessment.status !== 'extracting_questions' && assessment.status !== 'questions_extracted') {
    throw new Error('Phase 3 document processing must be completed before extracting questions');
  }

  assessmentStore.updateStatus(assessmentId, 'extracting_questions');

  try {
    const qpData = assessment.processedData?.questionPaper;
    if (!qpData || !qpData.pages || qpData.pages.length === 0) {
      throw new Error('No processed question paper pages found');
    }

    const allBlocks: OCRBlock[] = [];

    // 1. Run OCR on all pages sequentially to preserve order
    for (const page of qpData.pages) {
      const imagePath = path.join(PROCESSED_DIR, assessmentId, 'questionPaper', page.imageId);
      const pageResult = await extractTextFromPage(imagePath, page.pageNumber, page.width, page.height);
      allBlocks.push(...pageResult.blocks);
    }

    // 2. Parse OCR blocks into structured questions
    const questions = parseOCRBlocksToQuestions(allBlocks);

    // 3. Store result
    assessment.questions = questions;
    assessmentStore.updateStatus(assessmentId, 'questions_extracted');

    return questions;
  } catch (error: any) {
    assessmentStore.updateStatus(assessmentId, 'failed', error.message);
    throw error;
  }
}

function parseOCRBlocksToQuestions(blocks: OCRBlock[]): Question[] {
  const questions: Question[] = [];
  let currentQuestion: Question | null = null;
  let lastMajorNumber: string = '';

  for (const block of blocks) {
    const text = block.text.trim();
    if (!text) continue;

    // Check if this line starts a new question or sub-question
    const match = text.match(QUESTION_START_REGEX);
    let isNewQuestion = false;
    let extractedNumber = '';

    if (match && (match[1] || match[2])) {
      const majorNum = match[1]; // e.g., "1"
      const minorNum = match[2]; // e.g., "a"

      if (majorNum) {
        lastMajorNumber = majorNum;
      }

      // If it only has a minor part, it inherits the last major number
      if (minorNum) {
        extractedNumber = `${lastMajorNumber ? lastMajorNumber : ''}(${minorNum})`;
      } else {
        extractedNumber = lastMajorNumber;
      }

      // To avoid false positives (like year "2025." in the middle of a text),
      // we check if the match constitutes the very beginning of the line 
      // and isn't just a number mid-sentence (the regex enforces ^)
      // Still, we can add simple heuristics:
      isNewQuestion = true;
    }

    // Extract marks
    let cleanText = text;
    let maxMarks: number | undefined;
    const marksMatch = cleanText.match(MARKS_REGEX);
    if (marksMatch) {
      maxMarks = parseInt(marksMatch[1] || marksMatch[2], 10);
      cleanText = cleanText.replace(MARKS_REGEX, '').trim();
    }

    if (isNewQuestion && extractedNumber) {
      // Strip the question number from the text
      // e.g. "1. What is..." -> "What is..."
      // e.g. "1(a) Define..." -> "Define..."
      const numberPrefixStr = match![0];
      cleanText = cleanText.slice(numberPrefixStr.length).trim();

      const newQ: Question = {
        id: `q-${extractedNumber.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-4)}`,
        number: extractedNumber,
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
        needsReview: block.confidence < 80 // Tesseract confidence is 0-100
      };
      
      if (maxMarks !== undefined) {
        newQ.maxMarks = maxMarks;
      }

      questions.push(newQ);
      currentQuestion = newQ;
    } else if (currentQuestion) {
      // Continuation of current question
      if (cleanText) {
        currentQuestion.text = currentQuestion.text ? `${currentQuestion.text} ${cleanText}` : cleanText;
      }
      
      if (maxMarks !== undefined) {
        currentQuestion.maxMarks = maxMarks;
      }
      
      if (currentQuestion.confidence !== undefined) {
        currentQuestion.confidence = Math.min(currentQuestion.confidence, block.confidence);
        currentQuestion.needsReview = currentQuestion.confidence < 80;
      }

      // Add or expand region
      const existingRegion = currentQuestion.regions.find(r => r.page === block.pageNumber);
      if (existingRegion) {
        // Expand the bounding box to include this line
        const endX1 = existingRegion.x + existingRegion.width;
        const endY1 = existingRegion.y + existingRegion.height;
        const endX2 = block.boundingBox.x + block.boundingBox.width;
        const endY2 = block.boundingBox.y + block.boundingBox.height;
        
        existingRegion.x = Math.min(existingRegion.x, block.boundingBox.x);
        existingRegion.y = Math.min(existingRegion.y, block.boundingBox.y);
        existingRegion.width = Math.max(endX1, endX2) - existingRegion.x;
        existingRegion.height = Math.max(endY1, endY2) - existingRegion.y;
      } else {
        currentQuestion.regions.push({
          page: block.pageNumber,
          x: block.boundingBox.x,
          y: block.boundingBox.y,
          width: block.boundingBox.width,
          height: block.boundingBox.height
        });
      }
    }
  }

  return questions;
}
