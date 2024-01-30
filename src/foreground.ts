import { Message } from "./modules/message";
import { getSubmissionDetails } from "./modules/service";

chrome.runtime.onMessage.addListener(async (message: Message) => {
  switch (message.type) {
    case "requestDetails":
      chrome.runtime.sendMessage({
        type: "responseDetails",
        payload: { details: await getSubmissionDetails(message.payload.id) },
      });
  }
  return true;
});
