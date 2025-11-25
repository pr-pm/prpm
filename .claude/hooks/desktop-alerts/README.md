# Desktop Alerts

Sends desktop notifications when Claude Code shows alerts or needs input.

## What It Does

Displays native desktop notifications for Claude Code events, so you know when Claude needs attention even when the terminal isn't visible.

## How It Works

- **Event**: `Notification` (when Claude shows alerts)
- **Triggers On**: All notification events
- **Performance**: Fast (< 100ms)
- **Platform Support**: macOS, Linux

## Requirements

**macOS:** Built-in support via AppleScript, or install terminal-notifier for better notifications:
```bash
brew install terminal-notifier
```

**Linux:** Install libnotify-bin:
```bash
sudo apt-get install libnotify-bin  # Debian/Ubuntu
sudo dnf install libnotify           # Fedora
```

## Installation

```bash
prpm install @prpm/desktop-alerts
```

## Example Notifications

- "Claude needs your input to continue"
- "Task completed successfully"
- "Error occurred during execution"

## Use Cases

- Get notified when long-running tasks complete
- Know when Claude needs a decision from you
- Stay informed when working in other apps
- Monitor Claude activity in the background

## Customization

The hook automatically detects your platform and uses the appropriate notification method:
- macOS: terminal-notifier or AppleScript
- Linux: notify-send (libnotify)

## Uninstall

```bash
prpm uninstall @prpm/desktop-alerts
```

## Troubleshooting

**No notifications appearing:**
1. Check if notification tool is installed
2. Verify system notification permissions
3. Test manually: `notify-send "Test" "Message"` (Linux) or `osascript -e 'display notification "Test"'` (macOS)
