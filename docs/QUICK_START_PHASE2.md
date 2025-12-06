# Phase 2: Quick Start Guide

## Prerequisites Checklist

- [ ] PR #197 (Gemini extensions) is **merged** into main
- [ ] Local main branch is **up to date**: `git pull origin main`
- [ ] All tests passing: `npm test` ✅
- [ ] All builds passing: `npm run build` ✅

---

## Setup (5 minutes)

```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Create new branch
git checkout -b cross-format-enhancements

# 3. Verify clean state
git status  # Should be clean
npm test    # All 442+ tests should pass
npm run build  # Should succeed

# 4. Open task breakdown
code docs/phase2-task-breakdown.md
```

---

## Implementation Order

### Day 1: Gemini ↔ Claude (16 hours)

#### Morning (4h): MCP Transformer
```bash
# Create new directory
mkdir -p packages/converters/src/cross-converters

# Tasks: A1-A4
- [ ] TASK-A1: Create mcp-transformer.ts skeleton (2h)
- [ ] TASK-A2: Gemini → Claude transform (1h)
- [ ] TASK-A3: Claude → Gemini transform (1h)
- [ ] TASK-A4: Write tests (30min)

# Verify
npm test -- mcp-transformer.test.ts
```

#### Afternoon (6h): Gemini → Claude
```bash
# Tasks: A5-A10
- [ ] TASK-A5: Create gemini-to-claude.ts skeleton (1h)
- [ ] TASK-A6: Metadata extraction (1h)
- [ ] TASK-A7: MCP server transformation (1h)
- [ ] TASK-A8: Context file conversion (1h)
- [ ] TASK-A9: Handle warnings (30min)
- [ ] TASK-A10: Write tests (1.5h)

# Verify
npm test -- gemini-to-claude.test.ts
```

#### Evening (6h): Claude → Gemini
```bash
# Tasks: A11 (similar to A5-A10)
- [ ] Create claude-to-gemini.ts (5h)
- [ ] Write tests (1h)

# Verify
npm test -- claude-to-gemini.test.ts
```

**End of Day 1 Checkpoint**:
```bash
# All Part A tests should pass
npm test -- cross-converters/

# Commit progress
git add packages/converters/src/cross-converters/
git commit -m "feat: implement Gemini ↔ Claude cross-converters

- Add MCP transformer utility
- Implement Gemini → Claude conversion
- Implement Claude → Gemini conversion
- Add comprehensive tests (35+ test cases)
"
```

---

### Day 2: File References (16 hours)

#### Morning (2h): Types
```bash
# Tasks: B1-B2
- [ ] TASK-B1: Add FileReferenceSection to canonical.ts (1h)
- [ ] TASK-B2: Update canonical.schema.json (1h)

# Verify
npm run build --workspace=@pr-pm/converters
```

#### Mid-Morning to Afternoon (6h): Utilities
```bash
# Create utils directory
mkdir -p packages/converters/src/utils

# Tasks: B3-B4
- [ ] TASK-B3: Create file-references.ts (4h)
  - extractFileReferences()
  - extractEmbeddedFiles()
  - generateFileReferences()
  - generateEmbeddedFiles()
- [ ] TASK-B4: Write tests (2h)

# Verify
npm test -- file-references.test.ts
```

#### Evening (8h): Cursor Converters
```bash
# Tasks: B5-B6
- [ ] TASK-B5: Update from-cursor.ts (2h)
- [ ] TASK-B6: Update to-cursor.ts (2h)
- [ ] TASK-B7: Update from-claude.ts (1.5h)
- [ ] TASK-B8: Update to-claude.ts (1.5h)

# Verify
npm test -- from-cursor.test.ts
npm test -- to-cursor.test.ts
npm test -- from-claude.test.ts
npm test -- to-claude.test.ts
```

**End of Day 2 Checkpoint**:
```bash
# All Part B converter tests should pass
npm test

# Commit progress
git add packages/converters/
git commit -m "feat: add multi-file package support

- Add FileReferenceSection to canonical
- Implement file reference utilities
- Update Cursor converters for @file references
- Update Claude converters for multi-file skills
- Add comprehensive tests (20+ test cases)
"
```

---

### Day 3: Integration (12 hours)

#### Morning (4h): Export & CLI Convert
```bash
# Tasks: A12-A13
- [ ] TASK-A12: Export converters in index.ts (15min)
- [ ] TASK-A13: Update CLI convert command (2h)
- [ ] TASK-A14: Update CLI install command (1.5h)

# Verify
npm run build --workspace=@pr-pm/cli
npm test -- convert.test.ts
```

#### Afternoon (6h): CLI Install Updates
```bash
# Tasks: B9
- [ ] TASK-B9: Update install for companion files (3h)

# Verify
npm test -- install.test.ts

# Manual test
prpm install @user/test-package --as cursor
```

#### Evening (2h): Integration Tests
```bash
# Tasks: TEST-1, TEST-2
- [ ] TASK-TEST-1: Roundtrip tests (2h)
- [ ] TASK-TEST-2: CLI integration tests (2h)

# Verify
npm test -- roundtrip-cross-format.test.ts
npm test -- multi-file-install.test.ts
```

**End of Day 3 Checkpoint**:
```bash
# ALL tests should pass
npm test  # 540+ tests

# Commit progress
git add packages/
git commit -m "feat: integrate cross-format converters with CLI

- Export cross-converters from index
- Add --direct flag to convert command
- Update install command for companion files
- Add integration tests
"
```

---

### Day 4: Polish & PR (12 hours)

#### Morning (4h): Documentation
```bash
# Tasks: DOC-1, DOC-2
- [ ] TASK-DOC-1: Update converter docs (2h)
- [ ] TASK-DOC-2: Write user guide (2h)

# Files to update:
- packages/converters/docs/README.md
- packages/converters/docs/gemini-plugin.md
- packages/converters/docs/claude.md
- docs/guides/multi-file-packages.md (new)
```

#### Afternoon (4h): Manual Testing
```bash
# Test real-world scenarios
- [ ] Install Gemini extension → Claude plugin
- [ ] Install Claude plugin → Gemini extension
- [ ] Install multi-file skill → Cursor rule with @file
- [ ] Install multi-file skill → Cursor rule embedded
- [ ] Verify MCP servers work
- [ ] Verify @file references work in Cursor IDE
```

#### Evening (4h): PR Preparation
```bash
# 1. Final verification
npm run build  # All builds pass
npm test       # All tests pass
npm run lint   # No lint errors

# 2. Rebase on main
git fetch origin main
git rebase origin/main

# 3. Clean up commits (if needed)
git rebase -i HEAD~10  # Squash small fixup commits

# 4. Push branch
git push -u origin cross-format-enhancements

# 5. Create PR
gh pr create --title "feat: Cross-format conversions and multi-file package support" \
  --body "$(cat docs/PR_TEMPLATE_PHASE2.md)"
```

---

## Quick Commands Reference

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- mcp-transformer.test.ts

# Run tests in watch mode
npm test -- --watch

# Check coverage
npm test -- --coverage
```

### Building
```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@pr-pm/converters
npm run build --workspace=@pr-pm/cli
```

### Linting
```bash
# Lint all
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Git
```bash
# Check status
git status

# Stage changes
git add packages/converters/src/cross-converters/

# Commit with message
git commit -m "feat: add MCP transformer"

# Push to remote
git push

# Create PR
gh pr create
```

---

## Troubleshooting

### Tests Failing?
```bash
# 1. Check which test failed
npm test 2>&1 | grep -A 5 "FAIL"

# 2. Run just that test
npm test -- failing-test.test.ts

# 3. Check for TypeScript errors
npm run build

# 4. If all else fails, revert last commit
git log --oneline -5
git revert HEAD
```

### Build Failing?
```bash
# 1. Check TypeScript errors
npm run build 2>&1 | grep "error TS"

# 2. Clean and rebuild
rm -rf packages/*/dist
npm run build

# 3. Check for circular dependencies
npm run build --workspace=@pr-pm/types
npm run build --workspace=@pr-pm/converters
npm run build --workspace=@pr-pm/cli
```

### Import Errors?
```bash
# Make sure to use .js extensions
import { foo } from './foo.js';  # ✅ Correct
import { foo } from './foo';     # ❌ Wrong

# Check exports in index.ts
export { foo } from './foo.js';
```

---

## Daily Checklist Template

```markdown
## Day ___ (Date: YYYY-MM-DD)

### Morning Goals
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Afternoon Goals
- [ ] Task 4
- [ ] Task 5

### Evening Goals
- [ ] Task 6

### Completed Today
- ✅ Task X (2h)
- ✅ Task Y (1.5h)

### Blocked/Issues
- None / Issue description

### Tomorrow's Focus
- Start with Task Z
- Goal: Complete Part A

### Notes
- MCP transformer works well
- Need to adjust quality scoring
- Tests are comprehensive
```

---

## Emergency Contacts

### Stuck on Implementation?
- Refer to `docs/phase2-task-breakdown.md` for code templates
- Check `docs/cross-format-conversion-analysis.md` for design details
- Review existing converters for patterns

### Tests Not Passing?
- Check test fixtures in `packages/converters/src/__tests__/fixtures/`
- Review similar test files for patterns
- Ensure mocks are set up correctly

### Need Help?
- Create issue with `[Phase 2]` prefix
- Tag with `question` label
- Include error messages and context

---

## Success Indicators

### After Day 1
✅ MCP transformer works
✅ Gemini → Claude converter works
✅ Claude → Gemini converter works
✅ 35+ new tests passing

### After Day 2
✅ FileReferenceSection type exists
✅ File reference utilities work
✅ Cursor converters handle @file
✅ 55+ additional tests passing

### After Day 3
✅ CLI convert command works with --direct
✅ CLI install handles companion files
✅ Integration tests pass
✅ All 540+ tests passing

### After Day 4
✅ Documentation complete
✅ Manual testing done
✅ PR created
✅ Ready for review

---

## Final Checklist Before PR

- [ ] All tests passing (540+ tests)
- [ ] All builds passing
- [ ] Linter passing (no errors)
- [ ] Coverage > 90% for new code
- [ ] Documentation updated
- [ ] Manual testing complete
- [ ] Commits are clean and well-messaged
- [ ] Branch rebased on latest main
- [ ] PR description is comprehensive

---

**Ready? Let's build this!** 🚀

Refer to `docs/phase2-task-breakdown.md` for granular tasks.
