import { retry } from "./common";

/**
 * GraphQL endpoint for LeetCode.
 */
const ENDPOINT = "https://leetcode.com/graphql/";

/**
 * Mapping from language names to file extensions.
 */
const LANGUAGE = {
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
 * Response from the submission details query.
 */
interface Submission {
  accepted: boolean;
  code: string;
  language: string;
  memory: string;
  runtime: string;
  title: string;
  titleSlug: string;
}

/**
 * Fetche the submission details from LeetCode.
 * @param session The session cookie
 * @param submissionId The submission ID
 * @returns The submission details
 */
export const fetchSubmission = async (
  session: string,
  submissionId: number
): Promise<Submission> => {
  // Define the query
  const query = `
    query submissionDetails($submissionId: Int!) {
      submissionDetails(submissionId: $submissionId) {
        question {
          title
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
  `;

  // Send the request
  const response = await fetch(ENDPOINT, {
    headers: {
      "content-type": "application/json",
      cookie: `LEETCODE_SESSION=${session}`,
    },
    body: JSON.stringify({
      query,
      variables: { submissionId },
      operationName: "submissionDetails",
    }),
    method: "POST",
  });

  // Validate the response
  if (!response.ok) {
    throw new Error("fetchSubmission, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.submissionDetails === null) {
    throw new Error(`fetchSubmission, empty response`);
  }
  const { submissionDetails: details } = data;

  // Return the parsed details
  return {
    accepted: details.totalCorrect === details.totalTestcases,
    code: details.code,
    language: details.lang.name,
    memory: details.memoryDisplay,
    runtime: details.runtimeDisplay,
    title: details.question.title,
    titleSlug: details.question.titleSlug,
  };
};

/**
 * Response from one item in the progress list query.
 */
interface Progress {
  titleSlug: string;
  topicTags: string[];
}

/**
 * Fetche the progress list from LeetCode at a specific page.
 * @param session The session cookie
 * @param pageNo The page number
 * @returns Whether there are more pages and items on that page
 */
export const fetchProgressListAt = async (
  session: string,
  pageNo: number
): Promise<[boolean, Progress[]]> => {
  // Define the query
  const query = `
    query progressList($pageNo: Int, $numPerPage: Int, $filters: ProgressListFilterInput) {
      solvedQuestionsInfo(pageNo: $pageNo, numPerPage: $numPerPage, filters: $filters) {
        pageNum
        data {
          question {
            titleSlug
            topicTags {
              slug
            }
          }
        }
      }
    }
  `;

  // Send the request
  const response = await fetch(ENDPOINT, {
    headers: {
      "content-type": "application/json",
      cookie: `LEETCODE_SESSION=${session}`,
    },
    body: JSON.stringify({
      query,
      variables: {
        pageNo,
        numPerPage: 50,
        filters: {},
      },
      operationName: "progressList",
    }),
    method: "POST",
  });

  // Validate the response
  if (!response.ok) {
    throw new Error("fetchProgressListAt, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.solvedQuestionsInfo === null) {
    throw new Error("fetchProgressListAt, empty response");
  }

  // Parse the response
  const { data: items } = data.solvedQuestionsInfo;
  const history = items.map((item: any) => {
    return {
      titleSlug: item.question.titleSlug,
      topicTags: item.question.topicTags.map((t: any) => t.slug),
    };
  });
  const pageNum = data.solvedQuestionsInfo.pageNum;
  const hasMore = pageNo < pageNum;

  // Return the parsed details
  return [hasMore, history];
};

/**
 * Fetche the entire progress list from LeetCode.
 * @param session The session cookie
 */
export const fetchProgressList = async (session: string) => {
  // Prepare the parameters
  const history: Progress[] = [];
  var [pageNo, hasMore] = [1, true];

  // Loop until there are no more pages
  while (hasMore) {
    const response = await retry(() => fetchProgressListAt(session, pageNo));
    var [hasMore, items] = response;
    history.push(...items);
    pageNo++;
  }
  return history;
};

export const fetchLastSubmitted = async (
  session: string,
  titleSlug: string
): Promise<number> => {
  // Define the query
  const query = `
    query submissionList($offset: Int!, $limit: Int!, $lastKey: String, $questionSlug: String!, $lang: Int, $status: Int) {
      questionSubmissionList(
        offset: $offset
        limit: $limit
        lastKey: $lastKey
        questionSlug: $questionSlug
        lang: $lang
        status: $status
      ) {
        lastKey
        hasNext
        submissions {
          id
        }
      }
    }
  `;

  // Send the request
  const response = await fetch(ENDPOINT, {
    headers: {
      "content-type": "application/json",
      cookie: `LEETCODE_SESSION=${session}`,
    },
    body: JSON.stringify({
      query,
      variables: {
        offset: 0,
        limit: 20,
        questionSlug: titleSlug,
        status: 10,
      },
      operationName: "submissionList",
    }),
    method: "POST",
  });

  // Validate the response
  if (!response.ok) {
    throw new Error("fetchLastSubmitted, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.questionSubmissionList === null) {
    throw new Error("fetchLastSubmitted, empty response");
  }

  // Parse the response
  const { submissions } = data.questionSubmissionList;
  return parseInt(submissions[0].id);
};
