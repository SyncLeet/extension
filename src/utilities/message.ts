interface CommitFilesMessage {
  action: "commitFiles";
  params: {
    message: string;
    changes: { path: string; content: string }[];
  };
}

interface FetchSubmissionDetailsMessage {
  action: "fetchSubmissionDetails";
  params: {
    submissionId: number;
  };
}

interface CreateNotificationsMessage {
  action: "createNotifications";
  params: {
    title: string;
    message: string;
  };
}

export type Message = CommitFilesMessage | FetchSubmissionDetailsMessage | CreateNotificationsMessage;
