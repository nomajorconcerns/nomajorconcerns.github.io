# SideEye: a summary for AI agents reading this site

Site: {{cfg:siteUrl}}

- What it is: agent detection and response for AI agents. Goal: learn what is normal for each agent on a computer, flag what is not, and contain the agent.
- Status: in development, not released, nothing to download.
- Built: a desktop console (Windows build tested) that runs on sample data, and a read-only live view of Cephalo's audit log on the same machine.
- Planned, not built: per-agent baselines, anomaly flags, containment.
- The site has two interactive simulations ("Make it weird" and a baseline timeline). They run on scripted, seeded data in the browser and are labelled Simulation. They illustrate the intended behaviour; SideEye does not detect these today.
- Data: SideEye reads Cephalo's audit log read-only, keeps settings in ~/.sideeye/settings.json, and has no HTTP client, telemetry or updater. Its source is not published yet, so this is not independently checkable.
- Not installable yet: no download or package. Windows installer exists locally, unsigned, unpublished.
- Limit: today it detects nothing on its own. Detection is not prevention.
- Relationship to Cephalo ({{cfg:cephaloUrl}}): neither requires the other. Cephalo blocks tool calls before they run.
- Joint site: {{cfg:jointUrl}}
- Repo: {{cfg:repo}}
