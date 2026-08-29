import { assessmentStore } from '../store/assessmentStore';
import { QuestionAnswerMapping, MappingSummary, Question, StudentAnswer } from '../types';
import { normalizeQuestionNumber } from '../utils/questionNumberUtils';

export function mapAnswersToQuestions(assessmentId: string): { mappings: QuestionAnswerMapping[], summary: MappingSummary } {
  const assessment = assessmentStore.getAssessment(assessmentId);
  if (!assessment) {
    throw new Error('Assessment not found');
  }

  if (
    assessment.status !== 'answers_extracted' &&
    assessment.status !== 'mapping_answers' &&
    assessment.status !== 'answers_mapped'
  ) {
    throw new Error('Answers must be extracted before mapping');
  }

  const questions = assessment.questions || [];
  const answers = assessment.answers || [];

  if (questions.length === 0) {
    throw new Error('No questions available to map');
  }

  assessmentStore.updateStatus(assessmentId, 'mapping_answers');

  try {
    const mappings: QuestionAnswerMapping[] = [];
    const usedAnswerIds = new Set<string>();

    // 1. Build lookup for questions by normalized number
    const qMap = new Map<string, Question>();
    for (const q of questions) {
      qMap.set(normalizeQuestionNumber(q.number), q);
    }

    // 2. Group answers by normalized extracted reference
    const answersByNormRef = new Map<string, StudentAnswer[]>();
    for (const a of answers) {
      if (a.questionNumber) {
        const norm = normalizeQuestionNumber(a.questionNumber);
        if (!answersByNormRef.has(norm)) answersByNormRef.set(norm, []);
        answersByNormRef.get(norm)!.push(a);
      }
    }

    // Pass 1 & 2: Match explicitly referenced answers (Exact/Normalized) and flag conflicts
    for (const q of questions) {
      const qNorm = normalizeQuestionNumber(q.number);
      const candidates = answersByNormRef.get(qNorm);

      if (candidates && candidates.length === 1) {
        // Single match
        const ans = candidates[0];
        const isExact = (ans.questionNumber || '').trim().toLowerCase() === q.number.trim().toLowerCase();
        mappings.push({
          id: `map-${q.id}-${ans.id}`,
          questionId: q.id,
          answerId: ans.id,
          status: 'matched',
          confidence: isExact ? 1.0 : 0.95,
          method: isExact ? 'exact_question_number' : 'normalized_question_number',
          needsReview: false
        });
        usedAnswerIds.add(ans.id);
      } else if (candidates && candidates.length > 1) {
        // Conflict
        mappings.push({
          id: `map-conflict-${q.id}`,
          questionId: q.id,
          answerId: null,
          status: 'conflict',
          confidence: 0,
          method: 'conflict',
          needsReview: true,
          candidateAnswerIds: candidates.map(a => a.id)
        });
        candidates.forEach(a => usedAnswerIds.add(a.id));
      } else {
        // Currently Unanswered (might be resolved by structural inference later)
        mappings.push({
          id: `map-unans-${q.id}`,
          questionId: q.id,
          answerId: null,
          status: 'unanswered',
          confidence: 0,
          method: 'unmatched',
          needsReview: false
        });
      }
    }

    // Pass 3: Structural Inference for anonymous answers
    // If an answer has no identifier (or identifier didn't match), and sits perfectly between two mapped answers.
    const unmappedAnswers = answers.filter(a => !usedAnswerIds.has(a.id));
    for (const ans of unmappedAnswers) {
      const ansIndex = answers.findIndex(a => a.id === ans.id);
      
      // Look at immediate neighbors in the answer sheet
      const prevAns = ansIndex > 0 ? answers[ansIndex - 1] : null;
      const nextAns = ansIndex < answers.length - 1 ? answers[ansIndex + 1] : null;

      let inferredQuestionId: string | null = null;

      if (prevAns && nextAns) {
        // Both neighbors exist. Are they mapped securely?
        const prevMapping = mappings.find(m => m.answerId === prevAns.id && m.status === 'matched');
        const nextMapping = mappings.find(m => m.answerId === nextAns.id && m.status === 'matched');

        if (prevMapping && nextMapping) {
          // Find their question indices
          const qPrevIdx = questions.findIndex(q => q.id === prevMapping.questionId);
          const qNextIdx = questions.findIndex(q => q.id === nextMapping.questionId);
          
          // If they map to Q(i) and Q(i+2), the anonymous answer is highly likely Q(i+1)
          if (qNextIdx - qPrevIdx === 2) {
            const inferredQ = questions[qPrevIdx + 1];
            // Check if this question is currently flagged as unanswered
            const unansMapping = mappings.find(m => m.questionId === inferredQ.id && m.status === 'unanswered');
            if (unansMapping) {
              unansMapping.answerId = ans.id;
              unansMapping.status = 'needs_review';
              unansMapping.method = 'structural_inference';
              unansMapping.confidence = 0.75;
              unansMapping.needsReview = true;
              usedAnswerIds.add(ans.id);
              inferredQuestionId = inferredQ.id;
            }
          }
        }
      }
    }

    // Pass 4: Finalize remaining unmatched answers
    for (const ans of answers) {
      if (!usedAnswerIds.has(ans.id)) {
        mappings.push({
          id: `map-unmatched-${ans.id}`,
          questionId: null,
          answerId: ans.id,
          status: 'unmatched',
          confidence: 0,
          method: 'unmatched',
          needsReview: true
        });
      }
    }

    // 5. Generate Summary
    const summary: MappingSummary = {
      totalQuestions: questions.length,
      answered: mappings.filter(m => m.status === 'matched' || m.status === 'needs_review').length,
      unanswered: mappings.filter(m => m.status === 'unanswered').length,
      unmatchedAnswers: mappings.filter(m => m.status === 'unmatched').length,
      conflicts: mappings.filter(m => m.status === 'conflict').length,
      needsReview: mappings.filter(m => m.needsReview).length
    };

    // Store back in assessment
    assessment.mappings = mappings;
    assessment.mappingSummary = summary;
    assessmentStore.updateStatus(assessmentId, 'answers_mapped');

    return { mappings, summary };
  } catch (error: any) {
    assessmentStore.updateStatus(assessmentId, 'failed', error.message);
    throw error;
  }
}
