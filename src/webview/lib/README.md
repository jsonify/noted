# Third-Party Libraries

This folder contains bundled third-party JavaScript libraries used by the webview components.

## vis-network

- **File**: `vis-network.min.js`
- **Version**: 10.0.2
- **Source**: https://github.com/visjs/vis-network
- **License**: MIT / Apache-2.0
- **Purpose**: Graph visualization for the Note Graph view
- **Bundled**: This file is bundled directly in the extension to avoid requiring users to install node_modules

### Updating vis-network

To update vis-network to a newer version:

1. Update the package.json dependency: `pnpm add vis-network@latest`
2. Copy the new file: `cp node_modules/vis-network/dist/vis-network.min.js src/webview/lib/`
3. Update this README with the new version number
