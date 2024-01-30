import { QuestionDetails, SubmissionDetails, SubmissionId } from "./interface";

interface RequestDetailsMessage {
  type: "requestDetails";
  payload: {
    id: SubmissionId;
  };
}

interface ResponseDetailsMessage {
  type: "responseDetails";
  payload: {
    submissionDetails: SubmissionDetails;
    questionDetails: QuestionDetails;
  };
}

export type Message = RequestDetailsMessage | ResponseDetailsMessage;
