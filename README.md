# SyncLeet

![Build Check](https://github.com/SyncLeet/extension/actions/workflows/run-test.yml/badge.svg)

Synchronize your LeetCode submissions to GitHub.

- [Contributing](#contributing)
  - [Setup Instructions](#setup-instructions)
  - [Caveats](#caveats)

## Contributing

### Setup Instructions

1. Install dependencies by running `yarn install`.
2. Create `.env` file under the root directory with the following contents:
   - `CLIENT_ID` and the associated `CLIENT_SECRET` from GitHub OAuth App.
3. Depending on your use case, execute the following scripts:
   - `yarn build` to build the project.
   - `yarn watch` to continuously build the project as files change.
4. Enable developer mode in your Chrome browser by navigating to [chrome://extensions](chrome://extensions).
5. Click on "Load unpacked" and select the dist folder to install the extension.

### Caveats

1. Note that yarn watch will not automatically reload the extension. You must manually reload the extension on the [chrome://extensions](chrome://extensions) page.
2. SyncLeet has not been tested or officially supported on Firefox. Contributions are welcome!
