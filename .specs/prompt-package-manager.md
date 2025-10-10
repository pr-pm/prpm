# 🧠 Prompt Package Manager (PPM)

> **Prompt Package Manager (PPM)** lets you easily install and manage **prompt-based files** — such as **Cursor rules** and **Claude sub-agents** — directly in your project.  
> It’s like `npm`, but for prompts.

---

## ✨ Overview

PPM is a tiny CLI tool that:
- Fetches **Cursor rule sets** or **Claude sub-agent** folders from a URL or Git repository  
- Places them into the correct directory (`.cursor/rules/` or `.claude/agents/`)  
- Tracks where each package came from, so you can **update** or **remove** it later  

That’s it.  
No registry. No lockfiles. No scoring engine. Just **fetch → copy → track**.

---

## ⚙️ Installation

```bash
# install globally (future package)
npm install -g promptpm

# or use a standalone binary
brew install promptpm
```

*(You can replace these commands once you publish binaries or an npm module.)*

---

## 🧩 CLI Commands

### Add a prompt package
```bash
ppack add <source> [--as cursor|claude] [--id <name>] [--ref <tag|sha>] [--path <subdir>]
```

Examples:
```bash
# Add a Cursor rule set
ppack add https://github.com/acme/rules.git --as cursor --ref v1.0.0

# Add a Claude sub-agent from a subfolder
ppack add https://github.com/foo/sub-agents.git --as claude --path agents/reviewer/
```

### Update all packages
```bash
ppack pull
```

### Update one package
```bash
ppack update <id> [--ref <tag|sha>]
```

### Remove a package
```bash
ppack remove <id>
```

### List installed prompt packages
```bash
ppack list
```

---

## 📁 Project Structure

```
my-project/
  .cursor/rules/            # Cursor rule files (fetched via ppack)
  .claude/agents/           # Claude sub-agent folders
  .promptpm.json            # Tracks all sources
```

---

## 🧾 `.promptpm.json` Example

```json
{
  "sources": [
    {
      "id": "acme-rules",
      "type": "cursor",
      "source": "https://github.com/acme/rules.git",
      "ref": "v1.0.0",
      "paths": ["rules/"],
      "dest": ".cursor/rules/"
    },
    {
      "id": "reviewer-agent",
      "type": "claude",
      "source": "https://github.com/foo/sub-agents.git",
      "paths": ["agents/reviewer/"],
      "dest": ".claude/agents/reviewer/"
    }
  ]
}
```

---

## 🧠 How It Works

1. **Fetch** — PPM clones or downloads the target repository or folder.  
2. **Copy** — Files in the given `--path` are placed into the right directory:
   - `.cursor/rules/` (for `--as cursor`)
   - `.claude/agents/` (for `--as claude`)
3. **Track** — Metadata about the source and destination is saved in `.promptpm.json`.
4. **Update** — `ppack pull` re-fetches all sources and updates local files.

---

## 🪶 Behavior & Safety

- **Never executes code** — it only copies files.
- Existing files are **backed up** before overwrite:
  ```
  file.bak-2025-10-10-1330
  ```
- Works with:
  - GitHub/GitLab repositories (`https://github.com/...`)
  - Raw file URLs (`https://raw.githubusercontent.com/...`)

### Optional flags
| Flag | Description |
|------|--------------|
| `--skip-existing` | Don’t overwrite existing files |
| `--no-backup` | Skip backup creation |
| `--dry-run` | Show planned changes without writing |

---

## 🧰 Example Workflow

```bash
# Create a new project
mkdir my-project && cd my-project

# Add Cursor rules
ppack add https://github.com/acme/rules.git --as cursor

# Add a Claude sub-agent
ppack add https://github.com/foo/sub-agents.git --as claude --path agents/reviewer/

# Update everything later
ppack pull

# Remove a package
ppack remove reviewer-agent
```

Result:
```
my-project/
├── .cursor/rules/
│   └── ...
├── .claude/agents/
│   └── reviewer/
└── .promptpm.json
```

---

## 🧩 Design Philosophy

- **Minimalism first.**  
  Start as a glorified “git clone + copy” script.
- **Zero configuration.**  
  Folders and IDs inferred automatically.
- **Composable later.**  
  If it gains adoption, add manifests (`ppm.json`), registries, or score metadata.

---

## 🚀 Future Ideas

- Add `ppack search` for public registry integration (`prompt.pm`)  
- Allow version tags or semantic releases  
- Add optional metadata (`prompt.json`) for discoverability  
- Introduce lightweight scoring & provenance badges  

---

## 🪄 TL;DR

**Prompt Package Manager (PPM)** is the simplest way to:

> “Install, update, and remove Cursor rules or Claude sub-agents right in your project.”
