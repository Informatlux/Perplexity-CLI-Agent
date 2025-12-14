# Perplexity CLI Agent - Refactored Structure

## 📁 Project Structure

```
perplexity-cli-agent/
├── src/
│   ├── config/              # Configuration management
│   │   ├── constants.mjs    # Path constants and safePath helper
│   │   └── settings.mjs     # Settings load/save
│   │
│   ├── ui/                  # User interface utilities
│   │   ├── colors.mjs       # ANSI color definitions
│   │   ├── spinner.mjs      # Loading spinner
│   │   ├── formatting.mjs   # Text formatting, syntax highlighting
│   │   └── help.mjs         # Help messages and UI helpers
│   │
│   ├── api/                 # Perplexity API interactions
│   │   ├── perplexity.mjs   # API calls and usage tracking
│   │   └── router.mjs       # Query classification and routing
│   │
│   ├── filesystem/          # File system operations
│   │   ├── operations.mjs   # Read, write, copy, move, delete
│   │   └── navigation.mjs   # Tree, find, search operations
│   │
│   ├── git/                 # Git integration
│   │   └── operations.mjs   # Git status, diff, log
│   │
│   ├── project/             # Project analysis
│   │   ├── analysis.mjs     # Project type detection, file collection
│   │   └── context.mjs      # Smart file discovery, import tracing
│   │
│   ├── tools/               # Development tools
│   │   ├── code-analysis.mjs    # Code review, metrics
│   │   ├── code-generation.mjs  # Tests, docs, refactor, commits
│   │   └── scaffold.mjs         # Component scaffolding
│   │
│   ├── sessions/            # Session and snippet management
│   │   ├── sessions.mjs     # Save/load conversation sessions
│   │   └── snippets.mjs     # Code snippet library
│   │
│   └── brain/               # Project brain (context)
│       └── brain.mjs        # Project knowledge management
│
├── agent.mjs                # Original monolithic version (backup)
├── agent-new.mjs            # New modular entry point
└── README-REFACTOR.md       # This file

```

## 🚀 Usage

To use the refactored version:

```bash
# Run the new modular version
node agent-new.mjs

# Or rename it to replace the original
mv agent.mjs agent-old.mjs
mv agent-new.mjs agent.mjs
```

## ✨ Benefits of Refactoring

1. **Separation of Concerns** - Each module has a single responsibility
2. **Easier to Test** - Individual modules can be tested in isolation
3. **Better Maintainability** - Find and fix bugs faster
4. **Improved Readability** - Smaller, focused files are easier to understand
5. **Reusability** - Modules can be reused in other projects
6. **Scalability** - Easy to add new features without touching existing code

## 📦 Module Overview

### Config
- **constants.mjs** - Centralized path management and safety checks
- **settings.mjs** - User preferences and configuration

### UI
- **colors.mjs** - ANSI color codes for beautiful terminal output
- **spinner.mjs** - Loading indicators
- **formatting.mjs** - Syntax highlighting, diff display, response formatting
- **help.mjs** - Help text, settings display, utilities

### API
- **perplexity.mjs** - Direct API communication and usage tracking
- **router.mjs** - Smart query classification for optimal model selection

### Filesystem
- **operations.mjs** - CRUD operations for files and directories
- **navigation.mjs** - Directory traversal and search

### Git
- **operations.mjs** - Git commands integration

### Project
- **analysis.mjs** - Detect project type, collect files, search
- **context.mjs** - Smart file discovery based on queries

### Tools
- **code-analysis.mjs** - Code review and metrics
- **code-generation.mjs** - Generate tests, docs, commits
- **scaffold.mjs** - Generate new components

### Sessions & Brain
- **sessions.mjs** - Save/load conversation history
- **snippets.mjs** - Reusable code snippets
- **brain.mjs** - Project knowledge and context

## 🔧 Extending the Agent

### Adding a New Command

1. Create your function in the appropriate module
2. Export it from that module
3. Import it in `agent-new.mjs`
4. Add the command handler in the main loop

### Adding a New Module

1. Create a new directory under `src/`
2. Add your `.mjs` files
3. Export functions you want to use
4. Import in `agent-new.mjs`

## 📝 Notes

- The original `agent.mjs` (1300+ lines) is preserved as a backup
- The new version is much cleaner (~350 lines in main file)
- All functionality is preserved and working the same way
- Module imports use ES6 syntax (.mjs extension)

## 🎯 Next Steps

Consider these improvements:
- Add unit tests for each module
- Create a CLI using a framework like Commander.js
- Add TypeScript for better type safety
- Extract more reusable utilities
- Add logging framework
- Create plugins system
