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

## 🏗️ Project Structure
The project has been refactored for clarity:

- **`bin/`**: Contains the executable entry point (`cli.mjs`).
- **`src/`**: Source code modules.
    - **`ui/`**: Colors, banner logic, spinners.
    - **`api/`**: Perplexity API integration.
    - **`tools/`**: Code analysis and generation tools.

## 🎨 UI Guidelines
We maintain a strict visual identity aligned with the **Perplexity Brand**.

- **Colors**: ALWAYS use the palette defined in `src/ui/colors.mjs`.
    - `c.pplx.teal` (#20808D): Primary brand color. Use for borders, accents, and important prompts.
    - `c.pplx.white` (#FBFAF4): Use for primary text and tips.
    - `c.pplx.black` (#091717): Background color (implicit).
- **Layout**:
    - Respect the dynamic box layout (`agent-new.mjs`).
    - Ensure features work on varies terminal widths.

## 🧪 Development Guidelines

- **Code Style**: We follow standard JavaScript/ESM conventions.
- **Async/Await**: Use modern async/await patterns for file I/O and API calls.
- **Error Handling**: Wrap new commands in `try/catch` and set `lastError` for the `/fix` command to work.
- **Testing**: Run the agent locally:
  ```bash
  node bin/cli.mjs
  ```

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
