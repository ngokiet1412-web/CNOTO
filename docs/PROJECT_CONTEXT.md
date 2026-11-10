# Project context — BTL Công nghệ ô tô, HCMUT, HK261

**As-of:** 2026-11-10. **Course/project:** BTL Công nghệ ô tô (TR4087), 15-member student group.

## Core project change
- **Original draft approach (early October):** design a small RC vehicle from scratch, largely 3D printed; initial SV02 layout assumed two JGA25-370 motors directly driving rear wheels, L298N, LM2596 and 30-pin ESP32.
- **Actual reported workflow:** purchase an existing RC racing vehicle, disassemble, measure and reverse-engineer the parts in AutoCAD/SolidWorks, then reassemble and adapt an ESP32-based controller.
- The latter **supersedes the design-from-scratch framing**; older worksheets remain historical references, not confirmed as-built BOM.

## Team workflow / ownership
SV02 (owner discussing this project): **Bố trí chung (general vehicle layout)**. Inputs from chassis/underfloor, suspension/wheels, steering, powertrain, electrical control and assembly. Outputs: dimensioned whole-vehicle layout and interfaces validated against the real RC car. Other student roles are handled by the wider group.

## Evidence obtained
- Original CAD package `BTL CNOTO.zip`: 116 objects (93 SLDPRT, 16 SLDASM, 7 STEP); includes `Assem model.SLDASM`, many subassemblies and drawings.
- `FILE LỎ TẠM.pdf`: 26 exploded views BTL.001–BTL.026 with item callouts and parts lists; not a dimensioned hole-coordinate drawing.
- `ẢNH CẦN THIẾT.docx`: 18 assembly steps and placeholders linked to BTL.001–BTL.026.
- `cnoto` Google Doc: 18 embedded real RC-car photos, 16-page PDF export.
- `Source Code+ Schematic Diagram RC CAR.zip`: Arduino ESP32 firmware + React Native Expo app + wiring diagrams; includes huge generated `node_modules` directory and macOS metadata (do not commit).
- Drive index: design guidelines, preliminary SV02 A3 drawing and lookup table, partial parts/BOM, electronics spreadsheet and subteams' CAD.

## Scope not proven
Not verified: physical full assembly complete, SolidWorks mate solvability, correct configuration of real motor/servo and harness, precise wheelbase/track, center of gravity, or acceptance tests.

**Primary owner action:** get a **Pack and Go** (dependency-complete SolidWorks assembly) plus **AP242 STEP export** from `Assem model.SLDASM`, and a measured dimension sheet of the real car.

See `docs/CURRENT_STATUS.md` and `docs/DECISIONS_AND_CONFLICTS.md`.