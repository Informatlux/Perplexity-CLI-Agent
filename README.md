# Perplexity CLI Agent (v5.0)

A powerful, context-aware AI coding assistant that lives in your terminal. It integrates with Perplexity API (Sonar models) to understand your codebase, execute commands, and autonomously solve tasks.

**New in v5.0**:
- **Sticky Footer UI**: A modern input box that keeps context clean.
- **Live Autocomplete**: Instant command suggestions as you type `/`.
- **Modular Architecture**: 25+ robust slash commands for every task.
- **Cross-Platform**: Full support for Windows, macOS, and Linux.

## 🚀 Features

### 🧠 Intelligent & Context-Aware
- **Project Brain**: Remembers architecture and key files via `.pplx-brain.json`.
- **Deep Analysis**: Automatically traces imports and reads dependency files.
- **Smart Routing**: Dynamically switches to `sonar-reasoning` for complex tasks.
- **File Mentions**: Use `@filename` in any prompt to load context instantly.

### 🎨 Beautiful & Responsive UI
- **Instant Dropdown**: Type `/` to see all available commands instantly.
- **Rich Status Bar**: See memory usage, active model, and tokens at a glance.
- **Smart Formatting**: Markdown rendering with syntax highlighting for code blocks.
- **Transient Input**: Input history stays clean; UI elements vanish after use.

### ⚡ Keyboard Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Ctrl+L` | Clear screen and redraw interface |
| `Ctrl+C` | Double-press to Force Quit |
| `Esc` | Clear line or cancel selection |

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/aryan/perplexity-cli-agent.git
cd perplexity-cli-agent

# Install dependencies
npm install

# Link command (Optional, to use 'pplx' globally)
npm link

# Set API Key (REQUIRED)
# Get one at: https://www.perplexity.ai/settings/api
export PPLX_API_KEY="pplx-..." 
# Windows PowerShell:
# $env:PPLX_API_KEY="pplx-..."
```

## 🎮 Usage

Start the agent:

```bash
node bin/cli.mjs
# OR if linked:
pplx
```

### Slash Commands
Access these instantly by typing `/`:

**Core**
- `/chat`: Manage conversation history (save/resume/clear).
- `/model`: Switch between `sonar-pro`, `sonar-reasoning`, `auto`.
- `/clear`: Clear screen, history, or memory.
- `/quit`: Exit with session summary stats.

**Filesystem**
- `/ls`: Rich directory listing with icons and stats.
- `/cd`: Change directory with smart path resolution.
- `/read`: Read files with syntax highlighting.
- `/copy`: Copy last AI response to system clipboard.

**Perplexity**
- `/auth`: Manage API keys interactively.
- `/stats`: View detailed token usage and cost analysis.
- `/about`: System information and credits.
- `/help`: detailed command reference.

## ⚙️ Configuration
Settings are stored in `pplx-settings.json` (auto-created).
- `model`: Default AI model to use.
- `temperature`: Creativity setting (0.0 - 1.0).
- `autoSave`: Enable session auto-saving.

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License
MIT © [Informatlux](https://github.com/informatlux)
