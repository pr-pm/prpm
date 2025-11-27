# osgrep

Semantic code search using natural language queries. Use when users ask "where is X implemented", "how does Y work", "find the logic for Z", or need to locate code by concept rather than exact text. Returns file paths with line numbers and code snippets.

## When to Use

### Use this to find code by **concept** or **behavior** (e.g., "where is auth validated", "how are plugins loaded").

```bash
osgrep "how are plugins loaded"
osgrep "how are plugins loaded" packages/transformers.js/src
```


## Strategy for Different Query Types

- **Search Broadly First:** Use a conceptual query to map the landscape.
- `osgrep "authentication authorization checks"`
- **Survey the Results:** Look for patterns across multiple files:
- Are checks in middleware? Decorators? Multiple services?
- Do file paths suggest different layers (gateway, handlers, utils)?
- **Read Strategically:** Pick 2-4 files that represent different aspects:
- Read the main entry point
- Read representative middleware/util files
- Follow imports if architecture is unclear
- **Refine with Specific Searches:** If one aspect is unclear:
- `osgrep "session validation logic"`
- `osgrep "API authentication middleware"`
- **Search Specifically:** Ask about the precise logic.
- `osgrep "logic for merging user and default configuration"`
- **Evaluate the Semantic Match:**
- Does the snippet look relevant?
- **Crucial:** If it ends in `...` or cuts off mid-logic, **read the file**.
- **One Search, One Read:** Use osgrep to pinpoint the best file, then read it fully.

## Output Format

- `[Definition]`: Semantic search detected a class/function here. High relevance.
- `...`: **Truncation Marker**. Snippet is incomplete—use `read_file` for full context.

## Tips

- **Trust the Semantics:** You don't need exact names. `osgrep "how does the server start"` works better than guessing `osgrep "server.init"`.
- **Watch for Distributed Patterns:** If results span 5+ files in different directories, the feature is likely architectural—survey before diving deep.
- **Scope When Possible:** Use path constraints to focus: `osgrep "auth" src/server/`
- **Don't Over-Rely on Snippets:** For architectural questions, snippets are signposts, not answers. Read the key files.
- **"Still Indexing...":** If you see this, please stop, alert the user that the index is ongoing and ask them if they wish to proceed. Results will be partial until the index is complete.