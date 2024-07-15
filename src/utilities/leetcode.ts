import { retry } from "./common";

/**
 * GraphQL endpoint for LeetCode.
 */
const ENDPOINT = "https://leetcode.com/graphql/";

/**
 * Mapping from language names to file extensions.
 */
export const EXTENSION: { [key: string]: string } = {
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
export const fetchSubmissionById = async (
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
    throw new Error("fetchSubmissionById, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.submissionDetails === null) {
    throw new Error(`fetchSubmissionById, empty response`);
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
 * Fetch the topics for a problem by its title slug.
 * @param session The session cookie
 * @param titleSlug The title slug of the problem
 * @returns The topics for the problem
 */
export const fetchTopicsBySlug = async (
  session: string,
  titleSlug: string
): Promise<string[]> => {
  // Define the query
  const query = `
    query singleQuestionTopicTags($titleSlug: String!) { 
      question(titleSlug: $titleSlug) { 
        topicTags { slug } 
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
      variables: { titleSlug },
      operationName: "singleQuestionTopicTags",
    }),
    method: "POST",
  });

  // Validate the response
  if (!response.ok) {
    throw new Error("fetchTopicsBySlug, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.question === null) {
    throw new Error("fetchTopicsBySlug, empty response");
  }

  // Return the parsed details
  return data.question.topicTags.map((t: any) => t.slug);
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
export const fetchProgressAtPage = async (
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
    throw new Error("fetchProgressAtPage, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.solvedQuestionsInfo === null) {
    throw new Error("fetchProgressAtPage, empty response");
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
 * Fetch the last accepted submission ID for a problem.
 * @param session The session cookie
 * @param titleSlug The title slug of the problem
 * @returns The last submission ID
 */
export const fetchLastAcceptedId = async (
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
    throw new Error("fetchLastAcceptedId, invalid status");
  }
  const { data } = await response.json();
  if (data === null || data.questionSubmissionList === null) {
    throw new Error("fetchLastAcceptedId, empty response");
  }

  // Parse the response
  const { submissions } = data.questionSubmissionList;
  return parseInt(submissions[0].id);
};

/**
 * Fetch the history of submissions from LeetCode.
 * @param session The session cookie
 * @param reprotFn The function to report progress (i.e. completion of m out of n)
 * @returns The progress and submission history
 */
export const fetchHistory = async (
  session: string,
  reprotFn: (m: number, n: number) => void
): Promise<[Progress[], Submission[]]> => {
  // Fetch the progress at each page
  const progress: Progress[] = [];
  var [pageNo, hasMore] = [1, true];
  while (hasMore) {
    const response = await retry(() => fetchProgressAtPage(session, pageNo));
    var [hasMore, items] = response;
    progress.push(...items);
    pageNo++;
  }

  // Fetch the submission details for each item
  const history: Submission[] = [];
  for (let i = 0; i < progress.length; i += 4) {
    const promises = progress.slice(i, i + 4).map(async (item, idx) => {
      try {
        const fn1 = () => fetchLastAcceptedId(session, item.titleSlug);
        const acceptedId = await retry(fn1);
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
        const fn2 = () => fetchSubmissionById(session, acceptedId);
        const submission = await retry(fn2);
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
        return submission;
      } catch (error) {
        if (error instanceof Error) {
          return null;
        }
      }
    });
    const resolves = await Promise.all(promises)
    const filtered = resolves.filter((item) => item !== null);
    history.push(...filtered);
    reprotFn(history.length, progress.length);
  }

  // Question details and submission details are now available
  return [progress, history];
};
