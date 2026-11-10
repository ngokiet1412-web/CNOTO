# SV02 — Bố trí chung (General Layout)

## Scope
SV02 must produce an **as-built / reverse-engineered** package of the purchased RC car, NOT invent a chassis architecture.

## Data to resolve (mm unless otherwise stated)
- Coordinate frame: car centerline X (forward), Y (left), Z (up). Define ground plane at normal ride height and an explicit global datum.
- Overall vehicle: L/W/H including body/aero.
- Wheelbase, front/rear track widths (specify center-to-center measurement), tire OD/width and ride height.
- Steering pivot locations, steering arm/tie rod/caster/camber if measurably supported.
- Suspension: mount coordinates, free/compressed envelope and travel; collision envelope.
- Powertrain: gearbox/differentials/shaft centerlines, motor mount, gear cover, ground clearance.
- Electronic package: actual main motor, servo, battery pack(s), ESP32 board, power driver, buck converter, encoder; 3D envelope, mass, connector clearance, cable routing.
- Floorpan: attachment-hole pattern dimensioned in common global datum; serviceability/access to switch/charge port.
- Vehicle mass and front/rear axle loads (measured), CG location only when justified by data.

## Required outputs
1. Dimensioned front/side/top general arrangement (A3 PDF + native DWG/DXF if accessible).
2. CAD assembly / validated STEP AP242 with part map and explicit version.
3. Interface control sheet: part → measured/estimated dimension → datum → source → verification status.
4. Layout conflict log: collision/interference, mounting feasibility, wiring clearances.
5. Brief report chapter explaining reverse-engineering, assumptions and validation.
6. Comparison table 'CAD vs actual vehicle', with measurement deviations rather than invented tolerances.

## Known source inputs
- `BTL CNOTO.zip` includes `Assem model.SLDASM` plus suspension/steering STEP/part.
- `FILE LỎ TẠM.pdf` pages 15–26 show chassis, gearbox, drivetrain, suspension, electrical packaging and outer body assembly.
- `cnoto` real-photo Google Doc contains 18 images across 16 pages when exported.
- Drive preliminary `SV02_GENERAL_LAYOUT_A3.pdf` (2026-10-08), `layout.dwg` (2026-10-07), `Bang_Tra_Cuu_Thong_So_Linh_Kien.docx` (2026-10-21).
- Different floor/gear housing part versions exist; keep candidates separate until owners identify deployed version.

## Immediate next action
Request STEP export from real `Assem model.SLDASM`, not a synthetic union of 7 already-read STEP assemblies. Verify SolidWorks references before editing. Keep a list of missing true measurements and do not fill using pixel measurement of unscaled photographs.