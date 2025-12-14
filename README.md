# Perplexity CLI Agent (v5.0)

A powerful, context-aware AI coding assistant that lives in your terminal. It integrates with Perplexity API (Sonar models) to understand your codebase, execute commands, and autonomously solve tasks.

**New in v5.0**: A stunning, brand-aligned UI with dynamic resizing, improved input handling, and faster workflow.

## 🚀 Features

### 🧠 Intelligent & Context-Aware
- **Project Brain**: Remembers architecture, conventions, and key files via `.pplx-brain.json`.
- **Deep Analysis**: Automatically traces imports and reads dependency files to specific queries.
- **Smart Routing**: Dynamically switches to `sonar-reasoning` for complex tasks like "refactor" or "fix bug".
- **File Mentions**: Use `@filename` in any prompt to instantly load that file's context.

### 🎨 Beautiful & Responsive UI
- **Dynamic Headers**: The "PERPLEXITY" banner adjusts to your terminal width with elegant spacing.
- **Brand Themed**: Official colors (Teal & Paper White) for a premium experience.
- **Smart Input**: Box-styled prompt that stays clean and organized.
- **Shortcuts**: Double-press `Ctrl+C` or `ESC` to exit instantly.

### 🤖 Autonomous & Self-Healing
- **Auto Mode (`/auto`)**: Give it a goal (e.g., "Refactor auth and add tests"), and it loops through **Think -> Plan -> Act -> Verify**.
- **Self-Healing (`/fix`)**: If a command fails, type `/fix` to let the AI analyze the error and suggest a correction.
- **Natural Language Shell (`/do`)**: Type `do "Find all log files and delete them"` to auto-generate safe shell commands.

### 🛠️ Developer Power Tools
- **Code Analysis**: `grep`, `todo`, `audit` (dep checking), `metrics` (complexity), `uml` (diagrams).
- **Productivity**: `batch` (run scripts), `alias` (custom shortcuts), `snippet` (save fragments).
- **Safety**: Automatic backups (`undo` supported) and estimated token pricing (`usage`).

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
export PPLX_API_KEY="pplx-..." 
# or on Windows PowerShell:
# $env:PPLX_API_KEY="pplx-..."
```

## 🎮 Usage

Start the agent:

```bash
node bin/cli.mjs
# OR if linked:
pplx
```

### Commands
| Command | Action |
| :--- | :--- |
| **Chat** | |
| `ask <query>` | Chat with code context |
| `role <persona>` | Set AI persona (e.g., "Senior Architect") |
| `@file` | Reference a file in any query |
| **Explore** | |
| `ls`, `tree`, `find` | Navigate file system |
| `read <file>` | Read file code with highlighting |
| `deps`, `todo` | Analyze dependencies and TODOs |
| **Edit** | |
| `edit <file> <prompt>` | AI-driven code editing |
| `scaffold <type> <name>` | Generate boilerplate |
| **Agent** | |
| `auto <goal>` | Start autonomous loop |
| `fix` | Fix last error |
| `diff` | Show git diffs |

## ⚙️ Configuration
Settings are stored in `pplx-settings.json`.
- `model`: `sonar-pro` (default) or `sonar-reasoning`.
- `deepAnalysis`: Enable smart import tracing.
- `autoContext`: Automatically read files based on query.

## 🤝 Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License
MIT © [Aryan](https://github.com/aryan)
