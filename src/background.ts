const submittedIds = new Set<number>();

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const regex = /detail\/(.*?)\/check/;
    const match = details.url.match(regex);
    submittedIds.add(parseInt(match[1], 10));
  },
  { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
);

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const arrayBuffer = details.requestBody.raw[0].bytes;
    const textDecoder = new TextDecoder("utf-8");
    const decodedJson = JSON.parse(textDecoder.decode(arrayBuffer));
    if (decodedJson?.operationName == "submissionDetails") {
      const sid = decodedJson.variables.submissionId;
      if (submittedIds.delete(sid)) {
        // perform a graphQL to get the submission details
        // fetch("https://leetcode.com/graphql/", {
        //   body: '{"query":"\\n    query submissionDetails($submissionId: Int!) {\\n  submissionDetails(submissionId: $submissionId) {\\n    runtime\\n    runtimeDisplay\\n    runtimePercentile\\n    runtimeDistribution\\n    memory\\n    memoryDisplay\\n    memoryPercentile\\n    memoryDistribution\\n    code\\n    timestamp\\n    statusCode\\n    user {\\n      username\\n      profile {\\n        realName\\n        userAvatar\\n      }\\n    }\\n    lang {\\n      name\\n      verboseName\\n    }\\n    question {\\n      questionId\\n      titleSlug\\n      hasFrontendPreview\\n    }\\n    notes\\n    flagType\\n    topicTags {\\n      tagId\\n      slug\\n      name\\n    }\\n    runtimeError\\n    compileError\\n    lastTestcase\\n    totalCorrect\\n    totalTestcases\\n    fullCodeOutput\\n    testDescriptions\\n    testBodies\\n    testInfo\\n  }\\n}\\n    ","variables":{"submissionId":1146399373},"operationName":"submissionDetails"}',
        //   method: "POST",
        //   mode: "cors",
        //   credentials: "include",
        // });
      }
    }
  },
  { urls: ["https://leetcode.com/graphql/"] },
  ["requestBody"]
);
