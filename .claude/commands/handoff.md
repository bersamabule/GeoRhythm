# Session Handoff

Prepare a comprehensive handoff for the next session (whether it's another Claude instance, a different developer, or future you).

## Instructions

1. Create a chronicle entry for this session (see /chronicle)

2. Update CLAUDE.md with:
   - Current state of active work
   - Any new issues discovered
   - "For Next Session" section with detailed context

3. Generate a handoff summary with:
   - What was accomplished
   - Current state of the code (stable? broken? WIP?)
   - Exactly where work stopped
   - What needs to happen next
   - Any gotchas or context that might be lost

4. If any architectural decisions were made, create ADRs

5. Verify documentation is current:
   - CLAUDE.md reflects actual state
   - Chronicle entry captures session details
   - ADR index is up to date

## Handoff Checklist

- [ ] Chronicle entry created for this session
- [ ] CLAUDE.md "Active Work" section updated
- [ ] CLAUDE.md "For Next Session" section filled in
- [ ] Any new ADRs created and indexed
- [ ] Code is in a clean state (committed or stashed)
- [ ] No dangling TODOs without documentation

## Output

Provide a summary the next session can use to get started immediately.
