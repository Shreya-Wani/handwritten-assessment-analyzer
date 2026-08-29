# AI Assessment Analyzer

An AI-powered assessment analysis system that helps teachers analyze question papers and handwritten student answer sheets.

The application extracts questions from uploaded question papers, identifies handwritten answers from student answer sheets, maps answers to their corresponding questions, highlights the exact answer regions, and can provide automated grading insights.

---

## Features

- Upload question papers as PDF or images
- Upload handwritten student answer sheets as PDF or images
- Extract questions in their original printed order
- Preserve original question numbering
- Treat labelled sub-parts as separate questions
- Extract handwritten student answers
- Handle answers written out of order
- Detect unanswered questions
- Detect unmatched answers
- Map questions to corresponding answers
- Highlight the exact answer region on the answer sheet
- Support answers spanning multiple pages
- Display marks obtained versus maximum marks
- Provide AI-generated grading feedback
- Show assessment processing progress

---

## Core Workflow

```text
Question Paper
      │
      ▼
Question Extraction
      │
      ▼
Structured Questions
      │
      │
      └──────────────┐
                     │
                     ▼
              Answer Extraction
                     ▲
                     │
              Student Answer Sheet
                     │
                     ▼
              Answer Mapping
                     │
                     ▼
              Grading / Feedback
                     │
                     ▼
              Assessment Results
                     │
                     ▼
              Answer Highlighting