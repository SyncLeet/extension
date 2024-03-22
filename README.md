# SyncLeet

![Build Check](https://github.com/haok1402/SyncLeet/actions/workflows/build-check.yml/badge.svg)

Synchronize your LeetCode submissions to GitHub.

## Contributing

### Setup Instructions

1. Install dependencies by running `yarn install`.
2. Create `.env` file under the root directory with the following contents:

- `CLIENT_ID`: GitHub OAuth App client ID
- `CLIENT_SECRET`: GitHub OAuth App client secret

3. Depending on your use case, execute the following scripts:

- `yarn build`: Build the project
- `yarn watch`: Continuously build the project on file changes

4. Enable developer mode in your Chrome browser by navigating to `chrome://extensions`.
5. Click on "Load unpacked" and select the `dist` folder to load the extension.

### Codebase Overview

```bash
.
├── src
│   ├── background.ts   # Entry point for the service worker
│   ├── foreground.ts   # Entry point for the content script
│   ├── modules
│   │   ├── github.ts   # GitHub-related APIs
│   │   ├── leetcode.ts # LeetCode-related APIs
│   │   └── report.ts   # Persistent report system
│   ├── popup.ts        # Entry point for the popup
│   └── types
│       ├── github.ts   # GitHub-related types
│       ├── leetcode.ts # LeetCode-related types
│       └── report.ts   # Report-related types
```
