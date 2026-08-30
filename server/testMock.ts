import { OCRBlock } from './src/services/ocr/ocrTypes';
import fs from 'fs';

// Instead of importing, I will just inline the function from the latest codebase to see what it does.
const MARKS_REGEX = /(?:\[\s*(\d+)\s*\]|\(\s*(\d+)\s*(?:marks?|m)\s*\))\s*$/i;

function parseOCRBlocksToQuestions(blocks: OCRBlock[]): any[] {
  const questions: any[] = [];
  let currentQuestion: any = null;
  let lastMajorNumber: string = '';

  for (const block of blocks) {
    const lines = block.text.split('\n');

    for (const line of lines) {
      const text = line.trim();
      if (!text) continue;

      const match = text.match(/^\s*(?:Q\.?\s*)?(\d+)\s*(?:\.|\))?\s*(?:\(\s*([a-zA-Z0-9]+)\s*\))?(?:\.|\))?/i) || 
                    text.match(/^\s*(?:Q\.?\s*)?(?:\(\s*([a-zA-Z])\s*\))/i);
      
      let isNewQuestion = false;
      let extractedNumber = '';
      let numberPrefixLength = 0;

      if (match) {
        let majorNum: string | undefined;
        let minorNum: string | undefined;

        if (match.length === 3) {
           majorNum = match[1];
           minorNum = match[2];
        } else {
           minorNum = match[1];
        }

        if (majorNum) {
          lastMajorNumber = majorNum;
        }

        if (majorNum || minorNum) {
          if (minorNum) {
            extractedNumber = `${lastMajorNumber ? lastMajorNumber : ''}(${minorNum})`;
          } else {
            extractedNumber = lastMajorNumber;
          }
          isNewQuestion = true;
          numberPrefixLength = match[0].length;
        }
      }

      let cleanText = text;
      let maxMarks: number | undefined;
      const marksMatch = cleanText.match(MARKS_REGEX);
      if (marksMatch) {
        maxMarks = parseInt(marksMatch[1] || marksMatch[2], 10);
        cleanText = cleanText.replace(MARKS_REGEX, '').trim();
      }

      if (isNewQuestion && extractedNumber) {
        cleanText = cleanText.slice(numberPrefixLength).trim();
        cleanText = cleanText.replace(/^[.)]\s*/, '');

        const newQ: any = {
          number: extractedNumber,
          text: cleanText,
        };
        questions.push(newQ);
        currentQuestion = newQ;
      } else if (currentQuestion) {
        if (cleanText) {
          currentQuestion.text = currentQuestion.text ? `${currentQuestion.text} ${cleanText}` : cleanText;
        }
      }
    }
  }
  return questions;
}

const blocks: OCRBlock[] = [
  { text: '1. What is a variable in programming? Give one example.', pageNumber: 1, boundingBox: {x:0, y:0, width:100, height:20}, confidence: 90 },
  { text: '2. Explain the difference between a stack and a queue.', pageNumber: 1, boundingBox: {x:0, y:20, width:100, height:20}, confidence: 90 },
  { text: '3(a). What is normalization in a database? Explain its purpose.', pageNumber: 1, boundingBox: {x:0, y:40, width:100, height:20}, confidence: 90 },
  { text: '3(b). What is a primary key? Give an example.', pageNumber: 1, boundingBox: {x:0, y:60, width:100, height:20}, confidence: 90 },
  { text: '4. Explain the concept of time complexity with an example.', pageNumber: 2, boundingBox: {x:0, y:0, width:100, height:20}, confidence: 90 },
  { text: '5. What is an API? Explain how a REST API works.', pageNumber: 2, boundingBox: {x:0, y:20, width:100, height:20}, confidence: 90 }
];

console.log(parseOCRBlocksToQuestions(blocks));
