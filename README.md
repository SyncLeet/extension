# LeetSync

![Build Check](https://github.com/haok1402/LeetSync/actions/workflows/build-check.yml/badge.svg)

Synchronize your LeetCode submissions to GitHub.

- [Contributing](#contributing)
  - [Setup Instructions](#setup-instructions)
  - [Caveats](#caveats)

## Contributing

### Setup Instructions

1. Install dependencies by running `yarn install`.
2. Depending on your use case, execute the following scripts:
   - `yarn build` to build the project.
   - `yarn watch` to continuously build the project as files change.
3. Enable developer mode in your Chrome browser by navigating to [chrome://extensions](chrome://extensions).
4. Click on "Load unpacked" and select the dist folder to install the extension.

### Caveats

1. Note that yarn watch will not automatically reload the extension. You must manually reload the extension on the [chrome://extensions](chrome://extensions) page.
2. LeetSync has not been tested or officially supported on Firefox. Contributions are welcome!
