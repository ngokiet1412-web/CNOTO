# Current status — 2026-11-10 snapshot

Status refers to **accessible evidence**, not a declaration that people have finished/failed work.

| Workstream | Evidence verified | Gate status |
|---|---|---|
| General layout (SV02) | `layout.dwg`; `SV02_GENERAL_LAYOUT_A3.pdf`; parts lookup (Oct) | Preliminary; do not use as final as-built |
| Chassis/floor | `SV03- sàn.SLDPRT` on Drive, plus local `Tamsansat.SLDPRT` (different candidate versions) | Compare physical dimensions and exact revision |
| Suspension/wheels | Front/rear SLDASM and STEP in ZIP | Readable STEP geometry; mate/interference not confirmed |
| Steering | `Lái/Assem1.SLDASM` and multiple SLDPRT | Exists; specific steering servo hardware must be checked |
| Drivetrain | Center-mounted cylindrical motor and mechanical transmission visible in photos; differential/cardan exploded views | Architecture differs from draft 2-motor concept |
| CAD total assembly | `Assem model.SLDASM` in ZIP | Exists, full dependency resolution untested |
| Assembly drawings | 26 pages BTL.001–BTL.026 in `FILE LỎ TẠM.pdf` | Source for procedure/report illustrations |
| Real vehicle photos | Google Doc `cnoto`, 18 images on 16 exported PDF pages | Confirm visual layout only |
| Electronics | ESP32/IBT-2/XL4015/servo/encoder schematic + firmware/app; Drive components sheet | Hardware and code not yet reconciled |
| Full on-vehicle function | No documented end-to-end evidence inspected | NOT VERIFIED |
| Report parts 2/3 | Drive docs/sources | Drafts present |
| Report parts 4/5; test folder | No uploaded files found at audit | Missing evidence (not proof work absent) |

## CAD check previously performed
Seven STEP models loaded; 43 solid bodies retained in the inspection export. This is a **geometric import/export check only**, not an actual assembled vehicle. A 7-STEP staging file is not a validated assembly and must not be presented as such. Wheel envelope approximate from STEP: front Ø72 mm, rear Ø75 mm; orientation/packaging still needs verification.

## Source verification priority
1. Open/rebuild complete `Assem model.SLDASM` in SolidWorks; check missing references and mates; export AP242 STEP.
2. Confirm exact current motor and drive layout against real car photos.
3. Record physically measured wheelbase, front/rear track, tire OD, ride height, vehicle envelope and weights.
4. Reconcile electronic component dimensions with actual board/module used.
5. Reconcile CAD/reports and record completed physical test evidence.

## Ongoing evidence
See [Drive source index](../sources/SOURCE_INDEX.md) and [asset checksum manifest](../sources/UPLOAD_MANIFEST.md).