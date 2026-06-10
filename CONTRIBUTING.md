# Contribution Guide

Welcome to the Helius Node.js SDK! Thank you for considering to contribute; we value your input and want to make it as easy as possible for you to help. Here's how you can help make the SDK better. Before starting, please read this guide carefully to ensure your contributions align with our standards.

## Style Guide

To maintain high standards of quality, readability, and performance, code should adhere to the following principles:

- **File Naming**: Use `camelCase` or `kebab-case`, consistent with the rest of the codebase.
- **Entry Files**: Prefer meaningful filenames over generic ones like `index.ts`, unless used as module boundaries.
- **Type Safety**: We use TypeScript—ensure all new code is strongly typed.
- **Formatting**: Run `pnpm format` to ensure code style consistency.
- **Tree-Shakability**: Avoid top-level side effects.
- **Async Handling**: Use async/await for asynchronous operations, wrapped in try/catch blocks.
- **Error Handling**: Handle errors robustly, propagating meaningful messages with the relevant error codes from both Helius and Kit.
- **Documentation**: Update documentation if your changes affect how the SDK is used.
- **Testing**: Add or update unit/integrations tests for any new or modified functionality. Aim for 65%+ test coverage.

## Pull Requests

Pull Requests are the best way to propose changes to the SDK. We actively welcome all contributions! To contribute:

- Fork the repository and create your branch from main
- Install all project dependencies using `pnpm`

  ```bash
  # Install pnpm if you don't have it (requires Node.js)
  npm install -g pnpm

  # Install project dependencies
  pnpm install
  ```

- Make your changes in a clearly scoped branch (e.g., `feat/my-feature`, `fix/bug-description`)
- Add or update tests for new functionality
- Ensure all checks pass by running:

```bash
pnpm build
pnpm test
pnpm check-bundle # Verified tree-shakability and bundle sizes
```

- Format your code:

```bash
pnpm format
```

- [Sign your commits](#signing-your-commits-required) — **required**; unsigned commits will be rejected
- Open a pull request with a clear description and reference any related issues

### Signing Your Commits (Required)

**All commits must be signed and verified.** Pull requests that contain unsigned or unverified commits will fail CI and cannot be merged.

A "verified" commit is one GitHub can cryptographically tie to a registered signing key (GPG, SSH, or S/MIME). It shows a green **Verified** badge in the GitHub UI.

#### One-time setup

Follow GitHub's official guide to generate a signing key and configure Git to sign your commits:

**https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits**

The short version:

1. Generate or choose a signing key (GPG or SSH) — see the guide above.
2. Add the **public** key to your GitHub account under **Settings → SSH and GPG keys**.
3. Tell Git to use it and sign every commit automatically:

   ```bash
   # SSH signing (simplest if you already have an SSH key on GitHub)
   git config --global gpg.format ssh
   git config --global user.signingkey ~/.ssh/id_ed25519.pub
   git config --global commit.gpgsign true

   # — or — GPG signing
   git config --global user.signingkey <YOUR_KEY_ID>
   git config --global commit.gpgsign true
   ```

   Use `--global` to sign across all repos, or drop it to configure just this repo.

4. Confirm the email on your signing key matches a verified email on your GitHub account, otherwise commits show as **Unverified**.

#### Verifying it works

After committing, check the signature locally:

```bash
git log --show-signature -1
```

Once pushed, the commit should display a **Verified** badge on GitHub. If you have existing unsigned commits on a branch, you can re-sign them with:

```bash
git rebase --exec 'git commit --amend --no-edit -S' -i main
```

### Good Pull Request Titles

- `fix(paginator): Correct offset behavior in getTransactions`
- `feat(wallets): Add support for bulk wallet queries`
- `docs(auth): Update example for environment setup`

### Avoid Titles Like

- `fix #1234`
- `update code`
- `misc changes`

### Related Issues

If your pull request addresses an open issue, please mention it in the description (e.g., `Closes #1234`).

## License

By contributing, you agree that your contributions will be licensed under its MIT License. Thus, when you submit code changes, your submissions are understood to be under the [following license](https://github.com/helius-labs/helius-sdk/blob/main/LICENSE)

## Thank You!

We deeply appreciate your effort in making the Helius Node.js SDK better. Your contributions help power better tools for everyone in the ecosystem!
