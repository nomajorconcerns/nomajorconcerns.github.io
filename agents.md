# No Major Concerns: a summary for AI agents reading this site

Site: https://nomajorconcerns.github.io/

This site covers two local tools for people who let AI agents work on their machine. Everything below is what the products do today, with what is not built marked **Planned**.

## Cephalo (released)

- What it is: a guard for AI coding agents. It checks every shell command, file access and MCP tool call against rules the user owns (plain YAML in `~/.cephalo/rules.yml`) and blocks the dangerous ones before they run.
- How it works: it runs as each agent's pre-tool hook. No proxy, no patching of the agent.
- Agents: Claude Code and Hermes Agent (run in the real apps). Codex and Cursor adapters are tested against the vendors' documented hook formats, not run inside the real apps.
- Platforms: Windows, macOS, Linux (Node.js CLI).
- Install: `npm install -g @nomajorconcerns/cephalo`, then `cephalo init`. Node.js 20 or newer.
- Data: no telemetry in the code. The audit log stays in `~/.cephalo`.
- Licence: MIT. Version 0.1.1 is released and stays free. 0.2.0 launches Nov 10, 2026.
- Limit: it matches text patterns. A command assembled at run time, or hidden inside a script file, can slip past. It is a seatbelt, not a sandbox.
- Site: https://nomajorconcerns.github.io/cephalo/ · Repo: https://github.com/nomajorconcerns/cephalo

## SideEye (in development, not released)

- Goal: agent detection and response for AI agents. Learn what is normal for each agent on the computer, flag what is not, and contain the agent.
- Built: a desktop console (Windows build tested) that runs on sample data, and a read-only live view of Cephalo's audit log on the same machine.
- In development, not released: an approval pop-up for actions Cephalo holds (Claude Code only). It needs a Cephalo change that has not shipped.
- SideEye, built in its Windows console (not downloadable yet): reads Cephalo's log, learns a baseline per agent, raises alerts from twelve detections, suggests Cephalo rules with replay, and can hold, quarantine or end an agent. Holding needs a Cephalo change that is not released. Planned: owners and teams, other runtimes, signed installers, tamper protection.
- Limit: today it detects nothing on its own.
- Site: https://nomajorconcerns.github.io/sideeye/

## How they relate

Neither requires the other. Cephalo prevents (blocks a tool call before it runs). SideEye is meant to detect and respond (notice what slipped through, by behaviour). Today the only link is that SideEye can read Cephalo's log. Neither is a sandbox.

## This site

No cookies, no analytics, no third-party requests.

## Interactive parts of this site (all labelled Simulation)

- Layered defence, and a side-by-side split view: Cephalo's verdicts come from its real published 0.1.1 built-in rules (12 rules). SideEye's side is scripted, because SideEye detects nothing yet.
- What each layer catches: includes attacks neither covers (a command assembled inside a script; anything running as the user outside the agent's hooks).
- How they fit together: SideEye reads Cephalo's audit log (built, read only) and builds baselines and alerts from it. SideEye answering Cephalo's "ask", and holding or quarantining an agent through Cephalo, are in development and not in a released Cephalo. SideEye can write a suggested rule to a file; you copy it into Cephalo's rules file yourself. Shared alerts and settings are Planned.
- Which do I need, install tabs (Cephalo only / SideEye only / Both), bundle calculator on Planned prices. No checkout, no email capture.
- Pricing: Planned. Prices may change. Not on sale yet.
