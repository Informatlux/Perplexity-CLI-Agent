# 🚀 Quick Start Guide

## Navigate to the project directory

```bash
cd C:\Users\aryan\perplexity-cli-agent
```

## Run the agent

```bash
node agent-new.mjs
```

## If you get errors:

### Error: Missing PPLX_API_KEY
Set your API key first:
```bash
# Windows PowerShell
$env:PPLX_API_KEY="your-api-key-here"

# Windows CMD
set PPLX_API_KEY=your-api-key-here

# Linux/Mac
export PPLX_API_KEY=your-api-key-here
```

### Error: MODULE_NOT_FOUND
Make sure you're in the correct directory:
```bash
pwd  # Should show: C:\Users\aryan\perplexity-cli-agent
ls   # Should show: agent-new.mjs, src folder, etc.
```

## What was fixed:

✅ Fixed ROOT variable mutation issue (using state object now)
✅ Updated all modules to use getRoot() and setRoot()
✅ Added proper error handling
✅ Added usage validation for all commands
✅ Fixed import paths

## Testing the refactored version:

Try these commands:
```bash
help        # Show all commands
@           # List project files
ls          # List current directory
settings    # Show settings
```

## If everything works:

Replace the original file:
```bash
mv agent.mjs agent-backup.mjs
mv agent-new.mjs agent.mjs
```

## File Structure:

```
src/
├── config/         # Settings & constants
├── ui/             # Colors, spinner, formatting
├── api/            # Perplexity API
├── filesystem/     # File operations
├── git/            # Git integration
├── project/        # Project analysis
├── tools/          # Dev tools
├── sessions/       # Sessions & snippets
└── brain/          # Project knowledge
```
