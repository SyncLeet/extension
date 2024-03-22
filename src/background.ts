import { errorReport } from "src/modules/report";
import { initializeBackground as githubInitialize } from "src/modules/github";
import { initializeBackground as leetcodeInitialize } from "src/modules/leetcode";

try {
  githubInitialize().then((octokit) => {
    leetcodeInitialize(octokit);
  });
} catch (error) {
  errorReport({
    message: error.message,
    context: "background",
  });
}
