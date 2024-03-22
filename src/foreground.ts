import { errorReport } from "src/modules/report";
import { initializeForeground as leetcodeInitialize } from "src/modules/leetcode";

try {
  leetcodeInitialize();
} catch (error) {
  errorReport({
    message: error.message,
    context: "foreground",
  });
}
