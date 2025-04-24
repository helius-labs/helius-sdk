# Contributing to the Helius Node.js SDK

Thank you for considering contributing to the Helius Node.js SDK and related repositories. We appreciate your time and effort. This document outlines how you can contribute to the project.

## Table of Contents

- [Contributing to the Helius Node.js SDK](#contributing-to-the-helius-nodejs-sdk)
  - [Table of Contents](#table-of-contents)
  - [How Can I Contribute?](#how-can-i-contribute)
    - [Reporting Bugs](#reporting-bugs)
    - [Suggesting Enhancements](#suggesting-enhancements)
    - [Pull Requests](#pull-requests)
  - [Development Setup](#development-setup)
  - [Coding Standards](#coding-standards)
  - [Submitting Pull Requests](#submitting-pull-requests)

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/helius-labs/helius-sdk/issues).

If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/helius-labs/helius-sdk/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue on this repository providing the following information:

- **Use case:** Describe the problem you're trying to solve and why the enhancement would help.
- **Proposal:** Clearly outline the suggested enhancement.
- **Alternatives:** List any alternative solutions or features you've considered.
- **Additional context:** Add any other context or screenshots about the feature request here.

### Pull Requests

We welcome pull requests for bug fixes, enhancements, and documentation improvements.

## Development Setup

1.  **Fork the repository:** Click the "Fork" button on the top right of the [repository page](https://github.com/helius-labs/helius-sdk).
2.  **Clone your fork:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/helius-sdk.git
    cd helius-sdk
    ```
3.  **Install dependencies:** We use `pnpm` for package management.
    ```bash
    # Install pnpm if you don't have it (requires Node.js)
    npm install -g pnpm

    # Install project dependencies
    pnpm install
    ```
4.  **Build the project:**
    ```bash
    pnpm build
    ```
5.  **Run tests:**
    ```bash
    pnpm test
    ```
6.  **Create a branch for your changes:**
    ```bash
    git checkout -b feature/your-feature-name # or fix/your-bug-fix-name
    ```

## Coding Standards

- **Code Style:** Please follow the existing code style. We use Prettier and ESLint for code formatting and linting. Run `pnpm lint` and `pnpm format` before committing.
- **Types:** Ensure strong typing using TypeScript. Add TSDoc comments for public functions and types.
- **Tests:** Add unit tests for any new features or bug fixes. Ensure all tests pass (`pnpm test`).
- **Commit Messages:** Follow conventional commit message standards if possible (e.g., `feat: add new endpoint`, `fix: resolve issue with pagination`).

## Submitting Pull Requests

1.  Commit your changes with clear commit messages.
2.  Push your branch to your fork:
    ```bash
    git push origin feature/your-feature-name
    ```
3.  Open a pull request against the `main` branch of the `helius-labs/helius-sdk` repository.
4.  Provide a clear description of the problem and solution. Include the relevant issue number if applicable.
5.  Ensure all status checks pass.

The maintainers will review your pull request and provide feedback. Thank you for your contribution!