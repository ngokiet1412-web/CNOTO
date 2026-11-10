# Multi-agent workstreams / handoffs

**Coordinator:** owns source manifest, conflicts, verified state, issue routing, review. Does not invent new design decisions.

| Lane | Primary input | Deliverable | Acceptance gate |
|---|---|---|---|
| A: SV02 General layout | CAD assembly, real photos and measurements | Dimensioned A3 GA drawing + datum interfaces | Physical vs CAD dimensions verified |
| B: Mechanical CAD | `Assem model.SLDASM`, parts, 26 exploded drawings | Resolved Pack-and-Go, STEP AP242 and mate/interference report | Zero unknown missing components; no unexplained clashes |
| C: Powertrain | Actual motor label, drivetrain/gearbox models | Architecture, drive axles, gear ratio, mount interfaces | Consistent with real car |
| D: Electronics | Wiring, actual part labels, power supply | As-built schematic + BOM | Bench-safety and polarity/voltage validated |
| E: ESP32 firmware / Expo | Source ZIP (exclude dependencies) | Clean source, build instructions, calibration tests | Reproducible build + on-vehicle demonstration |
| F: Report / integration | Drawings and validated evidence | Sections 2–5, references, assembly and test evidence | Figures and measured values traceable |

## Workflow rules
- Use an Issue per uncertainty or feature, a named branch per deliverable.
- Every result names `source path + SHA256 / Drive link + status`.
- No agent should edit the original CAD without checkout/copy; no ad hoc changes to old approved drawings.
- Codex/Claude/ChatGPT may independently review; reviewer must not claim to have run SolidWorks or bench tests without doing so.
- Handoff should have summary, decisions, blockers, evidence, next owner and no more than five prioritized questions.