
export interface ExtractionResult {
  pageNumber: number;
  extractedText: string;
}

export interface QuestionEvaluation {
  questionNumber: string;
  maxMarks: number;
  obtainedMarks: number;
  feedback: string;
  studentAnswer: string;
  actualAnswer: string;
  status: 'answered' | 'skipped' | 'partially_answered';
}

export interface EvaluationReport {
  totalMarks: number;
  totalObtained: number;
  overallFeedback: string;
  questions: QuestionEvaluation[];
}

export enum AppStep {
  UPLOAD_STUDENT_SCRIPT = 0,
  EXTRACTING_STUDENT = 1,
  REVIEW_STUDENT_TEXT = 2,
  UPLOAD_MASTER_SCRIPT = 3,
  EXTRACTING_MASTER = 4,
  REVIEW_MASTER_TEXT = 5,
  EVALUATING = 6,
  FINAL_REPORT = 7
}
