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
    title: string;
    questionId: string;
    titleSlug: string;
  };
  totalCorrect: number;
  totalTestcases: number;
}

export interface QuestionDetails {
  topicTags: [
    {
      slug: string;
    }
  ]
}

export interface Submission {
  id: number;
  question_id: number;
  lang: string;
  lang_name: string;
  time: string;
  timestamp: number;
  status: number;
  status_display: string;
  runtime: string;
  url: string;
  is_pending: string;
  title: string;
  memory: string;
  code: string;
  compare_result: string;
  title_slug: string;
  has_notes: boolean;
  flag_type: number;
}

export interface SubmissionsResponse {
  last_key: string;
  has_next: boolean;
  submissions_dump: Submission[];
}