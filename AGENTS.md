# Agent contract — CNOTO

## Mission
Work on HCMUT BTL Công nghệ ô tô HK261: reverse-engineer an existing purchased RC car, restore and document assembly, and integrate electric control. Keep source evidence separate from hypotheses.

## First read (mandatory)
`README.md` → `docs/PROJECT_CONTEXT.md` → `docs/CURRENT_STATUS.md` → `docs/DECISIONS_AND_CONFLICTS.md` → `sources/SOURCE_INDEX.md` → your lane.

## Authority and labels
- `CONFIRMED_FROM_FILE`: directly observed in named source; quote exact file, date, path, page and coordinate if available.
- `PROVISIONAL`: catalogue/reference, suggested design or unverified CAD measurement.
- `CONFLICT`: two sources disagree; do not silently choose one.
- `NOT_VERIFIED`: no evidence of physical measurement, complete assembly mates, power-on tests or acceptance.
- `BLOCKED`: missing data/access/software, with one concrete evidence request.

## Safety and collaboration
- Repo is **PUBLIC**. Do not commit usernames/passwords/keys, local home paths, students' personal data or raw unreviewed chat exports. Do not expose school-only docs or photo originals unless sharing is authorized.
- Do not upload `node_modules`, `.expo`, `__MACOSX`, `.DS_Store`, temporary `~$` files, or duplicate archives.
- Source binary names and checksum belong in `sources/UPLOAD_MANIFEST.md`; links alone are **not repository copies**.
- Original unmodified CAD must remain intact. Preserve SolidWorks assembly-relative paths. Never fake an assembly, mate constraint, drawing dimension or calibration test.
- A `SLDASM` filename existing is not proof it rebuilds or resolves dependencies. Only SolidWorks inspection + exported AP242 STEP + verification can establish that.
- Never call the old two JGA25-370 direct-drive concept the final vehicle. Verify purchased car drivetrain and new electronics before changing layouts.
- Explicitly state what was **not tested**. Photos are evidence of visible configuration, not exact dimensions.
- Make changes on a feature branch or draft PR for substantive engineering/code edits. Do not auto-merge without owner approval. For status reports, link exact commit and source.
- Do not assume latest in Drive/Zalo equals latest in GitHub.

## Agent response format
1. Exact source and revision accessed
2. What is verified
3. Conflicts / missing evidence
4. Proposed scoped modification
5. Checks actually performed (and checks not performed)
6. Handoff and <=5 prioritized requests

## Roles
- Coordinator: context, ownership, issue tracking and evidence gate.
- SV02 CAD: geometric datum, packaging, wheelbase/track, interference, vehicle-vs-CAD check.
- Mechanical: assemblies, links, solid part versions, STEP conversion.
- Electronics: actual hardware/power wiring, connector and servo identification, safety.
- Firmware/App: cleaned source, reproducible build, telemetry calibration, hardware tests.
- Report: match written documentation to validated physical configuration.

No part, photo, code or design decision is 'approved' until owner/group confirmation.