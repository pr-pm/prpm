# Playground User Guide

Test and validate AI prompts with multiple models before installing them.

## Overview

The PRPM Playground lets you test packages with real AI models (Claude and GPT) to see how they perform before installing. It's perfect for:

- **Evaluating packages** - See if a package works for your use case
- **Comparing models** - Test how different AI models respond
- **Testing custom prompts** - Validate your own prompts before publishing
- **Learning** - Understand how prompts affect AI behavior

## Getting Started

### Prerequisites

1. **PRPM account** - Run `prpm login` to authenticate
2. **Playground credits** - Get free credits or subscribe to PRPM+

### Check Your Credits

```bash
prpm credits
```

Output:
```
💳 Playground Credits Balance

Total Balance: 1,250 credits

Breakdown:
  Monthly Credits:    1,000 (500 used this month)
  Rollover Credits:     250
  Purchased Credits:      0

Monthly Reset: 2025-02-01
Rollover Expires: 2025-03-01
```

## Using the Playground

### CLI Usage

#### Interactive Mode

Start an interactive testing session:

```bash
# Default model (Claude Sonnet)
prpm playground

# Choose specific model
prpm playground --model opus
prpm playground --model gpt-4o
```

**Interactive commands:**
- Type your test input and press Enter
- Type `exit` or `quit` to end session
- Conversation history is maintained
- Credits are displayed after each response

#### Test Specific Package

```bash
# Test a package from the registry
prpm playground --package @user/test-driven-development

# Test with specific input
prpm playground --package @user/react-helper --input "optimize this component"
```

#### Test Custom Prompts

```bash
# Load prompt from file
prpm playground --prompt-file my-prompt.md

# Test with input
prpm playground --prompt-file my-prompt.md --input "test case"
```

#### Compare Models

```bash
# Compare responses across models
prpm playground --compare

# Then enter your test input once, get responses from:
# - Claude Sonnet
# - Claude Opus
# - GPT-4o
```

### Web Interface

Visit [prpm.dev/playground](https://prpm.dev/playground):

1. **Select model** - Choose from Claude (Sonnet/Opus) or GPT (4o/4o-mini)
2. **Choose package or custom prompt**
   - Browse package library
   - Or paste custom prompt
3. **Enter test input** - Your query or test case
4. **Run test** - See response and credit usage
5. **Rate result** - Help improve package recommendations

**Features:**
- Visual model comparison
- Session history
- Copy responses
- Save test cases
- Export results

## Available Models

### Claude Models (Anthropic)

| Model | Credits/Request | Best For | Speed |
|-------|----------------|----------|-------|
| **Sonnet** | 10 | Balanced tasks, general use | Fast |
| **Opus** | 50 | Complex reasoning, code generation | Slower |

### GPT Models (OpenAI)

| Model | Credits/Request | Best For | Speed |
|-------|----------------|----------|-------|
| **GPT-4o** | 30 | Advanced tasks, latest features | Medium |
| **GPT-4o-mini** | 5 | Simple tasks, quick tests | Very Fast |
| **GPT-4 Turbo** | 40 | Complex reasoning | Medium |

**Credit costs are approximate and may vary based on response length.*

## Getting Credits

### Free Credits

New users get **50 free credits** to start testing.

### PRPM+ Subscription

Subscribe for monthly credits:

```bash
prpm subscribe
```

**PRPM+ Plan ($10/month):**
- 1,000 monthly credits
- Unused credits rollover (up to 2,000)
- Priority support
- Early access to features

### One-Time Purchase

Buy credits as needed:

```bash
prpm buy-credits
```

**Credit Packages:**
- **100 credits** - $2
- **500 credits** - $8
- **1,000 credits** - $15
- **5,000 credits** - $60

*Purchased credits never expire*

## Understanding Credit Usage

### Credit Deduction

Credits are deducted based on:
1. **Model selected** - Different models have different costs
2. **Response length** - Longer responses cost more
3. **Conversation history** - Context affects cost

### Checking Usage

```bash
# View credit balance
prpm credits

# View transaction history
prpm credits history

# Detailed history
prpm credits history --limit 50
```

### Credit Breakdown

Your balance includes:

1. **Monthly Credits** - From PRPM+ subscription (resets monthly)
2. **Rollover Credits** - Unused monthly credits (max 2 months)
3. **Purchased Credits** - One-time purchases (never expire)

**Usage order:** Monthly → Rollover → Purchased

## Testing Strategies

### Evaluating Packages

```bash
# 1. Test with your actual use case
prpm playground --package @user/api-helper \
  --input "create REST endpoint for user auth"

# 2. Try edge cases
prpm playground --package @user/api-helper \
  --input "handle OAuth2 with refresh tokens"

# 3. Compare with alternatives
prpm playground --package @user/alternative-api-tool \
  --input "create REST endpoint for user auth"
```

### Testing Custom Prompts

Before publishing your own package:

```bash
# 1. Create your prompt file
cat > my-prompt.md << EOF
You are an expert API designer. Help users create RESTful APIs following best practices.

When asked to create an endpoint:
1. Define clear routes
2. Specify HTTP methods
3. Include error handling
4. Add authentication
EOF

# 2. Test it
prpm playground --prompt-file my-prompt.md \
  --input "create user registration endpoint"

# 3. Iterate based on results
# Edit my-prompt.md and test again

# 4. When satisfied, publish
prpm publish
```

### Model Comparison

Test which model works best for your use case:

```bash
# Start comparison mode
prpm playground --compare --package @user/code-reviewer

# Enter test input once
# Get responses from all models
# Compare quality, style, and accuracy
```

## Interactive Mode Features

### Conversation History

The playground maintains conversation context:

```bash
prpm playground --model sonnet

> "What's the capital of France?"
Assistant: Paris is the capital of France.

> "What's its population?"
# Context maintained - knows "its" refers to Paris
Assistant: Paris has approximately 2.2 million people...
```

### Multi-Turn Testing

Test complex workflows:

```bash
prpm playground --package @user/project-planner

> "Plan a web app for task management"
# Get initial plan

> "Add user authentication"
# Plan updated with auth

> "What database should I use?"
# Recommendation based on previous context
```

### Session Management

Each session tracks:
- Full conversation history
- Total credits spent
- Model used
- Timestamp

View sessions in web interface or via `prpm credits history`

## Advanced Features

### Custom Prompt Testing

Test prompts before publishing:

```bash
# Test with multiple inputs
for input in "test 1" "test 2" "test 3"; do
  prpm playground --prompt-file my-prompt.md --input "$input"
done
```

### Automated Testing

Use non-interactive mode for automation:

```bash
# Test package with predefined inputs
inputs=("task 1" "task 2" "task 3")

for input in "${inputs[@]}"; do
  echo "Testing: $input"
  prpm playground --package @user/my-package \
    --input "$input" \
    --model gpt-4o-mini
done
```

### Feedback Collection

Rate responses to improve recommendations:

```bash
# After each test, you'll be prompted:
💭 Was this result effective? (y/n, or press Enter to skip)
   y

   Any comments? (optional, press Enter to skip)
   Great response, very accurate

# Feedback helps improve package rankings
```

## Best Practices

### Optimize Credit Usage

1. **Start with cheaper models** - Use GPT-4o-mini or Sonnet for initial tests
2. **Use specific inputs** - Shorter, focused inputs cost less
3. **Test incrementally** - Don't test full conversations immediately
4. **Compare selectively** - Only use --compare when needed

### Effective Testing

1. **Real-world inputs** - Use actual data you'll work with
2. **Edge cases** - Test unusual or complex scenarios
3. **Multiple attempts** - Try 3-5 different inputs per package
4. **Document results** - Note what works and what doesn't

### Before Publishing

If you're testing your own prompts:

1. **Test with all target models** - If for Claude, test both Sonnet and Opus
2. **Vary input styles** - Technical, casual, detailed, brief
3. **Check consistency** - Same input should give similar results
4. **Verify instructions** - Ensure the AI follows your prompt

## Troubleshooting

### Insufficient Credits

```
Error: Insufficient credits. Balance: 5, Required: 10
```

**Solution:**
```bash
# Check balance
prpm credits

# Subscribe for monthly credits
prpm subscribe

# Or buy one-time credits
prpm buy-credits
```

### Authentication Required

```
Error: You must be logged in to use the playground
```

**Solution:**
```bash
prpm login
```

### Model Timeout

If a model takes too long:

1. Try a faster model (GPT-4o-mini, Sonnet)
2. Simplify your input
3. Shorten conversation history
4. Try again later

### Unexpected Response

If the AI doesn't follow the prompt:

1. **Check prompt clarity** - Is it specific enough?
2. **Test with different model** - Some models handle certain tasks better
3. **Adjust input** - Rephrase your test input
4. **Review examples** - Look at successful packages for inspiration

## Playground Limits

### Rate Limits

- **Per session**: 100 requests
- **Per hour**: 200 requests
- **Per day**: 1,000 requests

**Note:** These are separate from credit limits

### Session Limits

- **Max conversation length**: 50 turns
- **Session timeout**: 1 hour of inactivity
- **Max history**: 100 sessions stored

### Response Limits

- **Max response length**: 4,000 tokens (~3,000 words)
- **Timeout**: 60 seconds per request

## Privacy & Security

### Data Handling

- **Prompts**: Temporarily stored for session duration
- **Inputs**: Not logged or stored permanently
- **Responses**: Stored only in your session history
- **Retention**: Sessions deleted after 30 days

### Security

- **Authentication**: Required via GitHub OAuth
- **Rate limiting**: Per-session fingerprinting
- **Credit fraud prevention**: Transaction monitoring
- **API keys**: Never exposed to users

## FAQ

### How much do tests cost?

Costs vary by model:
- GPT-4o-mini: ~5 credits
- Sonnet: ~10 credits
- GPT-4o: ~30 credits
- Opus: ~50 credits

Average test: 10-30 credits

### Can I test unlimited?

No, tests cost credits. However:
- PRPM+ gives 1,000 monthly credits
- Unused credits rollover
- Purchased credits never expire

### Do I need PRPM+ to use playground?

No, you can:
- Use free starter credits
- Purchase credits one-time
- Subscribe to PRPM+ for better value

### Can I test my own prompts?

Yes! Use `--prompt-file` to test custom prompts before publishing.

### Is testing required before installing?

No, but it's recommended if:
- Package cost matters (time investment)
- You need specific functionality
- Choosing between similar packages

### Can I test before publishing?

Yes, that's encouraged! Test thoroughly before publishing to ensure quality.

### Are test results saved?

Yes, in your session history:
- View in web interface
- Access via `prpm credits history`
- Export if needed

### Can teams share credits?

Not currently. Each account has separate credits. (Organizations feature coming soon)

## Examples

### Example 1: Evaluate Package

```bash
# Find package
prpm search "Python testing"

# Test it
prpm playground --package @user/pytest-helper

> "write unit tests for a FastAPI endpoint"
# Review response

> "add async test examples"
# See if it handles advanced cases

# Decide: Install if satisfied
prpm install @user/pytest-helper
```

### Example 2: Compare Models

```bash
# Test same input across models
prpm playground --package @user/code-reviewer --compare

> "review this React component for performance issues"

# Compare:
# - Sonnet: Quick, good enough
# - Opus: More detailed, slower
# - GPT-4o: Different perspective
```

### Example 3: Test Custom Prompt

```bash
# Create prompt
echo "Help users write clean Python code." > my-prompt.md

# Test
prpm playground --prompt-file my-prompt.md

> "refactor this function to be more readable"
# Iterate on prompt based on response

# Publish when ready
prpm publish
```

## See Also

- [CLI Reference](./CLI.md#playground-commands) - Command details
- [Credits Documentation](./PLAYGROUND_CREDITS_SYSTEM.md) - Credit system internals
- [Publishing Guide](./PUBLISHING.md) - Publish your tested prompts
- [Web Interface](https://prpm.dev/playground) - Browser-based testing

---

**Last updated:** January 2025
