<!-- PRPM_MANIFEST_START -->

<skills_system priority="1">
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills (loaded into main context):
- Use the <path> from the skill entry below
- Invoke: Bash("cat <path>")
- The skill content will load into your current context
- Example: Bash("cat .openskills/backend-architect/SKILL.md")

Usage notes:
- Skills share your context window
- Do not invoke a skill that is already loaded in your context
</usage>

<available_skills>

<skill activation="lazy">
<name>complex-skill</name>
<description>complex-skill skill</description>
<path>.openskills/complex-skill/SKILL.md</path>
</skill>

<skill activation="lazy">
<name>claude-skill</name>
<description>test-kiro skill</description>
<path>.openskills/claude-skill/SKILL.md</path>
</skill>

</available_skills>
</skills_system>

<agents_system priority="1">
<usage>
Agents are specialized AI assistants that run in independent contexts for complex multi-step tasks.

How to use agents (spawned with independent context):
- The <path> from the agent entry contains the agent definition file
- The agent definition will be automatically loaded into the subagent's context
- Invoke: Task(subagent_type="<agent-name>", prompt="task description")
- The agent runs in a separate context and returns results
- Example: Task(subagent_type="code-reviewer", prompt="Review the authentication code in auth.ts")

Usage notes:
- Agents have independent context windows
- Each agent invocation is stateless
- Agents are spawned as subprocesses via the Task tool
- The agent's AGENT.md file is loaded into the subagent's context automatically
</usage>

<available_agents>

<agent activation="lazy">
<name>windsurf-agent</name>
<description>windsurf-agent agent</description>
<path>.openagents/windsurf-agent/AGENT.md</path>
</agent>

<agent activation="lazy">
<name>claude-agent</name>
<description>claude-agent agent</description>
<path>.openagents/claude-agent/AGENT.md</path>
</agent>

</available_agents>
</agents_system>

<!-- PRPM_MANIFEST_END -->
