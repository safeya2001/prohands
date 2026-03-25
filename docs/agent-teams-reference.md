# Agent Teams Master Reference Guide

A comprehensive reference for building effective agent teams in Claude Code. Use this guide to design, configure, and run multi-agent workflows.

---

## Table of Contents

1. [What Are Agent Teams](#1-what-are-agent-teams)
2. [Enabling Agent Teams](#2-enabling-agent-teams)
3. [Architecture](#3-architecture)
4. [Agent Teams vs Subagents](#4-agent-teams-vs-subagents)
5. [When To Use Agent Teams](#5-when-to-use-agent-teams)
6. [Starting a Team](#6-starting-a-team)
7. [Display Modes](#7-display-modes)
8. [Controlling the Team](#8-controlling-the-team)
9. [Task Management](#9-task-management)
10. [Context and Communication](#10-context-and-communication)
11. [Permissions](#11-permissions)
12. [Hooks for Quality Gates](#12-hooks-for-quality-gates)
13. [Token Costs](#13-token-costs)
14. [Best Practices](#14-best-practices)
15. [Prompt Templates](#15-prompt-templates)
16. [Troubleshooting](#16-troubleshooting)
17. [Limitations](#17-limitations)

---

## 1. What Are Agent Teams

Agent teams let you coordinate multiple Claude Code instances working together. One session acts as the **team lead**, which coordinates work, assigns tasks, and synthesizes results. **Teammates** work independently, each in its own context window, and can communicate directly with each other — unlike subagents which only report back to the main agent.

- Requires Claude Code **v2.1.32 or later** (`claude --version`)
- Experimental feature, disabled by default
- Each teammate is a full, independent Claude Code session

---

## 2. Enabling Agent Teams

### Via settings.json (recommended for projects)

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Place in `.claude/settings.local.json` for local-only, or `.claude/settings.json` for project-wide.

### Via shell environment

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

---

## 3. Architecture

| Component     | Role                                                                                 |
| :------------ | :----------------------------------------------------------------------------------- |
| **Team Lead** | Main Claude Code session that creates the team, spawns teammates, and coordinates work |
| **Teammates** | Separate Claude Code instances that each work on assigned tasks                      |
| **Task List** | Shared list of work items that teammates claim and complete                          |
| **Mailbox**   | Messaging system for direct communication between agents                             |

### Storage locations

- **Team config**: `~/.claude/teams/{team-name}/config.json`
  - Contains a `members` array with each teammate's name, agent ID, and agent type
  - Teammates can read this file to discover other team members
- **Task list**: `~/.claude/tasks/{team-name}/`

### Task states

```
pending → in_progress → completed
```

Tasks can have **dependencies**: a pending task with unresolved dependencies cannot be claimed until those dependencies complete. The system manages this automatically — when a task completes, blocked tasks unblock without manual intervention.

**Task claiming** uses file locking to prevent race conditions when multiple teammates try to claim the same task simultaneously.

---

## 4. Agent Teams vs Subagents

| Property          | Subagents                                        | Agent Teams                                         |
| :---------------- | :----------------------------------------------- | :-------------------------------------------------- |
| **Context**       | Own context window; results return to caller     | Own context window; fully independent               |
| **Communication** | Report results back to main agent only           | Teammates message each other directly               |
| **Coordination**  | Main agent manages all work                      | Shared task list with self-coordination             |
| **Best for**      | Focused tasks where only the result matters      | Complex work requiring discussion and collaboration |
| **Token cost**    | Lower: results summarized back to main context   | Higher: each teammate is a separate Claude instance |

**Rule of thumb:**
- Use **subagents** when workers only need to report back a result
- Use **agent teams** when workers need to share findings, challenge each other, and self-coordinate

---

## 5. When To Use Agent Teams

### Strong use cases

- **Research and review** — multiple teammates investigate different aspects simultaneously, then share and challenge findings
- **New modules or features** — each teammate owns a separate piece with no file overlap
- **Debugging with competing hypotheses** — teammates test different theories in parallel and converge faster
- **Cross-layer coordination** — changes spanning frontend, backend, and tests, each owned by a different teammate

### Weak use cases (use single session or subagents instead)

- Sequential tasks where step B requires step A's output
- Tasks requiring edits to the same file
- Work with many interdependencies between steps
- Simple or routine tasks where overhead isn't justified

---

## 6. Starting a Team

### Natural language prompt (Claude decides structure)

```text
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles:
one teammate on UX, one on technical architecture, one playing devil's advocate.
```

### Explicit structure

```text
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### How Claude initiates teams

1. **You request a team** — explicitly ask for an agent team
2. **Claude proposes a team** — Claude determines your task benefits from parallel work and suggests it (you confirm before it proceeds)

Claude will never create a team without your approval.

---

## 7. Display Modes

### In-process (default when not in tmux)

All teammates run inside your main terminal.

- **Shift+Down** — cycle through teammates
- **Type** — send a message to the active teammate
- **Enter** — view a teammate's session
- **Escape** — interrupt their current turn
- **Ctrl+T** — toggle the task list

### Split panes (default when inside tmux)

Each teammate gets its own pane. Requires **tmux** or **iTerm2**.

- Click into a pane to interact with that teammate directly
- All teammates' output visible simultaneously

### Configuration

```json
{
  "teammateMode": "in-process"
}
```

Options: `"auto"` (default), `"in-process"`, `"tmux"`

### Force for a single session

```bash
claude --teammate-mode in-process
```

### Installing split-pane dependencies

```bash
# tmux (macOS)
brew install tmux
# Then use: tmux -CC (for iTerm2 integration)

# iTerm2 Python API
# Enable: iTerm2 → Settings → General → Magic → Enable Python API
# Install it2 CLI: npm install -g it2
```

> **Note:** Split panes are NOT supported in VS Code integrated terminal, Windows Terminal, or Ghostty.

---

## 8. Controlling the Team

### Specify teammates and model

```text
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

### Require plan approval before implementation

```text
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

**Approval flow:**
1. Teammate works in read-only plan mode
2. Sends plan approval request to lead
3. Lead reviews and approves or rejects with feedback
4. If rejected → teammate revises and resubmits
5. If approved → teammate exits plan mode and implements

Influence lead's judgment: "only approve plans that include test coverage" or "reject plans that modify the database schema."

### Message a teammate directly

- **In-process**: Shift+Down to cycle, then type
- **Split-pane**: click into the teammate's pane

### Broadcast to all teammates

```text
Tell all teammates to add docstrings to every function they modify.
```

> Use sparingly — costs scale with team size.

### Shut down a teammate

```text
Ask the researcher teammate to shut down.
```

The lead sends a shutdown request. The teammate can approve (exits gracefully) or reject with an explanation.

### Clean up the team

```text
Clean up the team.
```

> **Always use the lead to clean up.** Teammates should not run cleanup — their team context may not resolve correctly, potentially leaving resources in an inconsistent state. The lead checks for active teammates and fails if any are still running, so shut them down first.

---

## 9. Task Management

### Lead assigns explicitly

```text
Assign the "write unit tests for auth module" task to the testing teammate.
```

### Teammates self-claim

After finishing a task, a teammate picks up the next unassigned, unblocked task on its own.

### If a task is stuck

Check whether the work is actually done. If so:

```text
Mark the "refactor database layer" task as completed.
```

Or tell the lead to nudge the teammate directly.

### Ideal task sizing

- **Too small** — coordination overhead exceeds the benefit
- **Too large** — teammates work too long without check-ins, risk of wasted effort
- **Just right** — self-contained unit producing a clear deliverable (a function, a test file, a review)

**Target: 5–6 tasks per teammate.** If the lead isn't creating enough tasks, ask it to split the work into smaller pieces.

---

## 10. Context and Communication

### What teammates receive at spawn

- Project context (CLAUDE.md, MCP servers, skills)
- Spawn prompt from the lead
- **Does NOT inherit the lead's conversation history**

### Always include task-specific context in the spawn prompt

```text
Spawn a security reviewer teammate with the prompt: "Review the authentication
module at src/auth/ for security vulnerabilities. Focus on token handling,
session management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### Communication mechanics

- **Automatic message delivery** — messages are delivered automatically; the lead does not need to poll
- **Idle notifications** — when a teammate finishes and stops, it automatically notifies the lead
- **Shared task list** — all agents can see task status and claim available work

### Messaging types

| Type        | Description                                    | Use when                        |
| :---------- | :--------------------------------------------- | :------------------------------ |
| `message`   | Send to one specific teammate                  | Targeted instructions           |
| `broadcast` | Send to all teammates simultaneously           | Team-wide updates (use sparingly) |

---

## 11. Permissions

- Teammates **start with the lead's permission settings**
- If the lead runs with `--dangerously-skip-permissions`, all teammates do too
- You can change individual teammate modes **after spawning**, but not at spawn time
- Pre-approve common operations in permission settings **before spawning** to reduce interruption from permission prompts bubbling up to the lead

---

## 12. Hooks for Quality Gates

Use hooks to enforce rules at key moments in the team lifecycle.

### TeammateIdle

Runs when a teammate is about to go idle.

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "your-validation-command"
          }
        ]
      }
    ]
  }
}
```

- Exit with code **2** to send feedback and keep the teammate working

### TaskCompleted

Runs when a task is being marked complete.

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "your-quality-check-command"
          }
        ]
      }
    ]
  }
}
```

- Exit with code **2** to prevent completion and send feedback

---

## 13. Token Costs

Token usage **scales linearly with the number of active teammates**. Each teammate has its own context window and consumes tokens independently.

| Scenario                                   | Recommendation              |
| :----------------------------------------- | :-------------------------- |
| Research, review, new feature work         | Agent teams are worth it    |
| Routine, sequential, or single-file tasks  | Single session is cheaper   |

See the official Claude Code cost docs for `agent-team-token-costs`.

---

## 14. Best Practices

### Team size

- **Start with 3–5 teammates** for most workflows
- Scale up only when work genuinely benefits from true parallelism
- Three focused teammates often outperform five scattered ones
- Coordination overhead increases with team size

### Task design

- **5–6 tasks per teammate** keeps everyone productive without excessive context switching
- Each task should produce a **clear, self-contained deliverable**
- Break dependencies explicitly so tasks can run in parallel

### Avoid file conflicts

- Two teammates editing the same file leads to overwrites
- Divide work so each teammate owns a **different set of files**

### Provide rich spawn prompts

Include: file paths, relevant context, constraints, output format, severity ratings, or any domain-specific details the teammate needs. They don't get the lead's conversation history.

### Keep the lead delegating

```text
Wait for your teammates to complete their tasks before proceeding.
```

Monitor if the lead starts implementing tasks itself instead of delegating.

### Start simple

If new to agent teams, start with **research and review** tasks (clear boundaries, no file writes) before parallel implementation workflows.

### Monitor and steer actively

- Check in on progress
- Redirect approaches that aren't working
- Synthesize findings as they come in
- Don't let a team run unattended too long — risk of wasted effort increases

### Use CLAUDE.md for team-wide guidance

Teammates read CLAUDE.md from their working directory automatically. Use it to provide project-specific rules, conventions, and constraints that apply to all teammates.

---

## 15. Prompt Templates

### Parallel code review

```text
Create an agent team to review PR #[NUMBER]. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review independently and report findings to you.
```

### Competing hypotheses investigation

```text
Users report [PROBLEM DESCRIPTION].
Spawn 5 agent teammates to investigate different hypotheses. Have them talk
to each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```

### Parallel feature development

```text
Create a team with 3 teammates to build [FEATURE]:
- Teammate 1: implement [MODULE A] in [PATH]
- Teammate 2: implement [MODULE B] in [PATH]
- Teammate 3: write tests for both modules once they signal completion
Require plan approval before any teammate makes changes.
```

### Multi-perspective exploration

```text
Create an agent team to explore [TOPIC] from different angles:
- One teammate focused on [ANGLE 1]
- One teammate focused on [ANGLE 2]
- One teammate playing devil's advocate
Have them discuss and challenge each other's findings, then synthesize a summary.
```

### Cross-layer refactor

```text
Create a team to refactor [SYSTEM]. Assign:
- One teammate to [FRONTEND LAYER] in [PATH]
- One teammate to [BACKEND LAYER] in [PATH]
- One teammate to update all tests and documentation
Each teammate owns their layer completely. Coordinate through the task list.
```

---

## 16. Troubleshooting

### Teammates not appearing

- In-process mode: press **Shift+Down** to cycle — they may already be running
- Check if your task was complex enough to warrant a team (Claude decides)
- Verify tmux is installed: `which tmux`
- For iTerm2: verify `it2` CLI is installed and Python API is enabled

### Too many permission prompts

Pre-approve common operations in permission settings before spawning teammates.

### Teammates stopping on errors

Use Shift+Down (in-process) or click the pane (split mode) to check output, then:
- Give them additional instructions directly
- Spawn a replacement teammate to continue the work

### Lead shuts down before work is done

Tell it to keep going:

```text
Keep going — not all tasks are complete yet.
```

Or preemptively:

```text
Do not shut down until all teammates have completed their tasks and reported back.
```

### Orphaned tmux sessions

```bash
tmux ls
tmux kill-session -t <session-name>
```

### Task status not updating

If a task appears stuck but work is done, manually update status or tell the lead:

```text
The [TASK NAME] task is actually complete. Please mark it as done and unblock dependent tasks.
```

---

## 17. Limitations

| Limitation                        | Detail                                                                                          |
| :-------------------------------- | :---------------------------------------------------------------------------------------------- |
| **No session resumption**         | `/resume` and `/rewind` don't restore in-process teammates. Respawn new ones after resuming.   |
| **Task status can lag**           | Teammates sometimes fail to mark tasks complete, blocking dependent tasks. Nudge manually.     |
| **Slow shutdown**                 | Teammates finish their current request/tool call before shutting down.                          |
| **One team per session**          | A lead can only manage one team at a time. Clean up before starting a new one.                 |
| **No nested teams**               | Teammates cannot spawn their own teams. Only the lead can manage the team.                      |
| **Fixed lead**                    | The session that creates the team is lead for its lifetime. Leadership cannot be transferred.   |
| **Permissions set at spawn**      | All teammates start with the lead's mode. Per-teammate modes can only be set after spawn.      |
| **Split panes require tmux/iTerm2** | Not supported in VS Code integrated terminal, Windows Terminal, or Ghostty.                  |

---

## Quick Reference Card

```
ENABLE:       CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in settings.json
MIN VERSION:  claude v2.1.32+
TEAM SIZE:    3–5 teammates (start here)
TASKS/PERSON: 5–6 tasks per teammate
NAVIGATION:   Shift+Down (cycle) | Ctrl+T (task list) | Escape (interrupt)
CLEANUP:      Always use the lead — never a teammate
STORAGE:      ~/.claude/teams/{name}/config.json | ~/.claude/tasks/{name}/
HOOKS:        TeammateIdle (exit 2 = keep working) | TaskCompleted (exit 2 = block)
```

---

*Source: https://code.claude.com/docs/en/agent-teams — Captured 2026-03-25*
