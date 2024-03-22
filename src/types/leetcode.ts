export interface GraghQueryRequest {
  operationName: string;
  query: string;
  variables: Record<string, any>;
}

export interface SubmissionDetails {
  runtimeDisplay: string;
  memoryDisplay: string;
  code: string;
  statusCode: number;
  lang: {
    name: string;
  };
  question: {
    title: string;
    titleSlug: string;
  };
}

export type QuestionTopicTags = {
  slug: string;
}[];

export interface SubmissionTrigger {
  type: "submission-trigger";
  payload: {
    submissionId: number;
  };
}

export interface SubmissionHandler {
  type: "submission-handler";
  payload: {
    details: SubmissionDetails;
    topicTags: QuestionTopicTags;
  };
}
