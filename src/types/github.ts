/**
 * File payload to commit with the GitHub API
 */
export interface FileToCommit {
  path: string;
  content: string;
}
