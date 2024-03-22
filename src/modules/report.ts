import { Report } from "src/types/report";

/**
 * Persist incoming report to the local storage
 * @param {Report} payload
 */
const append = async (payload: Report): Promise<void> => {
  const values = await chrome.storage.local.get("report.history");
  const history: Report[] = values["report.history"] || [];

  history.push(payload);
  if (history.length > 100) {
    history.shift();
  }

  await chrome.storage.local.set({ "report.history": history });
};

/**
 * Persistent `console.debug`, used for debugging purposes
 * @param payload Report
 */
export const debugReport = async (payload: Report): Promise<void> => {
  await append(payload);
  console.log(payload);
};

/**
 * Persistent `throw new Error`, used for unrecoverable failures
 * @param payload Report
 */
export const errorReport = async (payload: Report): Promise<void> => {
  await append(payload);
  throw new Error(payload.message);
};

/**
 * Used for notifications, one-time messages, etc.
 * @param payload Report
 */
export const notifyReport = async (payload: Report): Promise<void> => {
  chrome.notifications.create("SyncLeet", {
    type: "basic",
    iconUrl: chrome.runtime.getURL("assets/images/logo128.png"),
    title: "SyncLeet",
    message: payload.message,
  });
};
