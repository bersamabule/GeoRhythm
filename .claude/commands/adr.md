# Create Architecture Decision Record

Create a new ADR to document an architectural decision.

## Instructions

1. Determine the next ADR number by checking `docs/adr/` for existing ADRs

2. Create the ADR file at `docs/adr/[NUMBER]-[short-title].md`
   - Use 4-digit numbering: 0001, 0002, etc.
   - Use lowercase hyphenated titles

3. Fill in the template with:
   - **Status**: Usually "Proposed" initially, then "Accepted"
   - **Context**: The problem or situation requiring a decision
   - **Options Considered**: At least 2-3 alternatives with pros/cons
   - **Decision**: Clear statement of what was decided
   - **Rationale**: Why this option was chosen
   - **Consequences**: Positive, negative, and neutral impacts

4. Update `docs/adr/README.md`:
   - Add the new ADR to the index table

5. Optionally update CLAUDE.md:
   - Add to "Key ADRs" table if it's a significant decision

## Template Location
`docs/adr/0000-template.md`

## What to Ask User
- What decision needs to be documented?
- What alternatives were considered?
- Why was this option chosen over others?
- Who were the decision makers?
