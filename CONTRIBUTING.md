# Contributing to Perplexity CLI Agent

Thank you for your interest in contributing! We welcome pull requests, bug reports, and feature suggestions.

## 🛠️ Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/perplexity-cli-agent.git
   cd perplexity-cli-agent
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your feature or fix:
   ```bash
   git checkout -b feature/amazing-feature
   ```

## 🧪 Development Guidelines

- **Code Style**: We follow standard JavaScript/ESM conventions.
- **Async/Await**: Use modern async/await patterns for file I/O and API calls.
- **Error Handling**: Wrap new commands in `try/catch` and set `lastError` for the `/fix` command to work.
- **Testing**: Run the agent locally (`node agent.mjs`) and verify your new command works as expected.

## 📝 Pull Request Process

1. Ensure your code passes basic manual tests.
2. Update the `README.md` if you added a new command or feature.
3. Submit a Pull Request with a clear description of the changes.

## 🐛 Reporting Bugs

Please open an issue on GitHub with:
- The command you ran.
- The error message (or screenshot).
- Steps to reproduce.
- (Optional) `pplx-settings.json` configuration.

Happy Coding! 🚀
