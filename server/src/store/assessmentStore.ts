import { Assessment, ProcessingStatus } from '../types';

class AssessmentStore {
  private assessments = new Map<string, Assessment>();

  /**
   * Create a new assessment and store it in memory.
   */
  createAssessment(id: string, questionPaper: any, answerSheet: any): Assessment {
    const assessment: Assessment = {
      id,
      status: 'uploaded',
      questionPaper,
      answerSheet,
      createdAt: new Date(),
    };
    this.assessments.set(id, assessment);
    return assessment;
  }

  /**
   * Get an assessment by its ID.
   */
  getAssessment(id: string): Assessment | undefined {
    return this.assessments.get(id);
  }

  /**
   * Update the status of an assessment.
   */
  updateStatus(id: string, status: ProcessingStatus, error?: string): Assessment | undefined {
    const assessment = this.assessments.get(id);
    if (!assessment) return undefined;
    
    assessment.status = status;
    if (error) {
      assessment.error = error;
    }
    return assessment;
  }

  /**
   * Update the processed data for a specific document type.
   */
  updateProcessedData(id: string, documentType: 'questionPaper' | 'answerSheet', data: any): Assessment | undefined {
    const assessment = this.assessments.get(id);
    if (!assessment) return undefined;

    if (!assessment.processedData) {
      assessment.processedData = {};
    }
    assessment.processedData[documentType] = data;
    return assessment;
  }

  setQuestionGrade(id: string, questionId: string, gradeData: { marksObtained: number | null, maxMarks: number | null, feedback?: string, graded: boolean }): Assessment {
    const assessment = this.getAssessment(id);
    if (!assessment) throw new Error(`Assessment ${id} not found`);
    
    if (!assessment.grades) {
      assessment.grades = {};
    }
    
    assessment.grades[questionId] = {
      questionId,
      ...gradeData
    };
    
    assessment.updatedAt = new Date();
    this.assessments.set(id, assessment);
    
    return assessment;
  }

  /**
   * Delete an assessment from the store.
   */
  deleteAssessment(id: string): boolean {
    return this.assessments.delete(id);
  }
}

export const assessmentStore = new AssessmentStore();
