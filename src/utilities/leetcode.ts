/**
 * Extension lookup table for LeetCode languages.
 */
export const extensionLookup = {
  cpp: "cpp",
  java: "java",
  python: "py",
  python3: "py",
  c: "c",
  csharp: "cs",
  javascript: "js",
  typescript: "ts",
  php: "php",
  swift: "swift",
  kotlin: "kt",
  dart: "dart",
  golang: "go",
  ruby: "rb",
  scala: "scala",
  rust: "rs",
  racket: "rkt",
  erlang: "erl",
  elixir: "ex",
  mysql: "sql",
  mssql: "sql",
  oraclesql: "sql",
  pythondata: "py",
  postgresql: "sql",
};

/**
 * Represents the details of a submission on LeetCode.
 */
interface SubmissionDetails {
  question: {
    title: string;
    questionId: string;
    titleSlug: string;
  };
  totalCorrect: number;
  totalTestcases: number;
  runtimeDisplay: string;
  memoryDisplay: string;
  code: string;
  lang: {
    name: string;
  };
}

/**
 * Represents the details of a LeetCode question.
 */
interface QuestionDetails {
  topicTags: [
    {
      slug: string;
    }
  ];
}

/**
 * Retrieves the details of a submission from LeetCode.
 *
 * @param submissionId - The ID of the submission.
 * @returns A Promise that resolves to the submission details.
 * @throws An error if the request fails.
 */
export const fetchSubmissionDetails = async (
  submissionId: number
): Promise<SubmissionDetails> => {
  const response = await fetch("https://leetcode.com/graphql/", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query submissionDetails($submissionId: Int!) {
          submissionDetails(submissionId: $submissionId) {
            question {
              title
              questionId
              titleSlug
            }
            totalCorrect
            totalTestcases
            runtimeDisplay
            memoryDisplay
            code
            lang {
              name
            }
          }
        }
      `,
      variables: { submissionId },
      operationName: "submissionDetails",
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch submission details for ${submissionId}`);
  }
  const { data } = await response.json();
  return data.submissionDetails;
};

/**
 * Retrieves the details of a question from LeetCode.
 *
 * @param titleSlug - The slug of the question.
 * @returns A Promise that resolves to the question details.
 * @throws An error if the request fails.
 */
export const fetchQuestionDetails = async (
  titleSlug: string
): Promise<QuestionDetails> => {
  const response = await fetch("https://leetcode.com/graphql/", {
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query: `
      query singleQuestionTopicTags($titleSlug: String!) { 
        question(titleSlug: $titleSlug) { 
          topicTags { slug } 
        } 
      }
    `,
      variables: { titleSlug },
      operationName: "singleQuestionTopicTags",
    }),
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch question details for ${titleSlug}`);
  }
  const { data } = await response.json();
  return data.question;
};
