RESEARCH:  Research what's involved in building [feature]. Investigate separately and
           report each on its own: (1) how this is usually done, (2) the main approaches
           and trade-offs, (3) what in our existing project it must fit, (4) failure modes
           and edge cases. One-page findings doc. No design or code yet.

SPECIFY:   Using the research and our constitution, draft spec.md for [feature]: goal,
           user scenarios, functional requirements, edge cases & rules, out-of-scope,
           acceptance criteria. Behaviour only — no tech choices. Make each requirement
           specific enough that a build ignoring it would visibly fail.

CLARIFY:   Before we build anything, interview me about this spec, one question at a
           time — ambiguities, missing edge cases, unstated assumptions — until there's
           nothing left to misread. No code yet.

BUILD:     Right-size it. Tiny change: just ask. Otherwise: have the agent propose a
           plan and review it, then let it build in small steps, checking each against
           the spec and committing as you go. Turn acceptance criteria into checks.