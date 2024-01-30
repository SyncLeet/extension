export interface GraghQueryRequest {
  operationName: string;
  query: string;
  variables: Record<string, any>;
}

export type SubmissionId = number;

export interface SubmissionDetails {
  runtimeDisplay: string;
  runtimePercentile: number;
  memoryDisplay: string;
  memoryPercentile: number;
  code: string;
  lang: {
    name: string;
  };
  question: {
    questionId: string;
    titleSlug: string;
  };
}

export interface QuestionDetails {
  difficulty: string;
}
