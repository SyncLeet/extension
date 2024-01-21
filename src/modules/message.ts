import { SubmissionDetails, SubmissionId } from "./interface";

interface RequestDetailsMessage {
  type: "requestDetails";
  payload: {
    id: SubmissionId;
  };
}

interface ResponseDetailsMessage {
  type: "responseDetails";
  payload: {
    details: SubmissionDetails;
  };
}

export type Message = RequestDetailsMessage | ResponseDetailsMessage;
