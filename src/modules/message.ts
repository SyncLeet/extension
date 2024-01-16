import { SubmissionDetails } from "./interface";

interface RequestDetailsMessage {
  type: "requestDetails";
  payload: {
    submissionId: number;
  };
}

interface ResponseDetailsMessage {
  type: "responseDetails";
  payload: {
    details: SubmissionDetails;
  };
}

export type Message = RequestDetailsMessage | ResponseDetailsMessage;
