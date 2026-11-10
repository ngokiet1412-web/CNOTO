# Decisions and unresolved conflicts (source-driven)

## D01 — Overall design approach (DECIDED BY OWNER)
**Reverse engineering of purchased RC car:** disassemble, measure, CAD model, reassemble. Earlier DIY / mostly 3D-print concept is historical. Some parts may still be printed; do not assume all parts are printed or all purchased.

## C01 — Drivetrain architecture (OPEN / HIGH)
- Old group direction sheet: 2× JGA25-370, direct-drive rear wheels.
- Newer electronics sheet (2026-11-02): 1× DJ390M and BTS7960, XL4015, 38-pin ESP32S.
- Exploded views: central motor, gearbox and drivetrain components/differentials.
- Real photos: cylindrical motor mounted within chassis; not two direct-drive wheel motors.
**Action:** identify actual motor/gearbox, count driven axles and whether it is brushed/brushless using photo of label, wiring and/or physical check. Do not assume `motor không chổi than` in the assembly draft is correct: firmware uses IBT-2 H-bridge for DC brushed motor.

## C02 — Electronics model and envelope (OPEN / HIGH)
- Draft SV02 lookup: L298N 43×43×27 mm, LM2596 43×21×14 mm, ESP32 DevKit V1 30-pin, MG996R reference.
- Later electrical spreadsheet: BTS7960 50×50×42 mm; XL4015 54×24×15 mm; ESP32S 38-pin 56×28×18 mm; servo 40×13×35 mm; DJ390M single motor.
- Firmware ZIP: IBT-2, XL4015, micro 9g servo, GPIO 25/26/27/33/32/13, speed encoder 20 slots.
**Action:** physically confirm installed parts and dimensions and label old plan 'superseded/unconfirmed'. Check servo torque and supply.

## C03 — Encoder calibration (OPEN)
Firmware initial `wheelDiameterMm = 65`; STEP front OD ~72 and rear ~75 mm. Potential mismatch; encoder might be on motor/gearbox rather than wheel. **Do not correct software based solely on tire OD.** Measure tire under load and confirm pulses/gear ratio first.

## C04 — CAD part version discrepancy (OPEN)
Separate local `Tamsansat.SLDPRT` differs from floor part in main ZIP. `Phía trên.SLDPRT` and `part duoi.SLDPRT` differ from same-name candidate files in ZIP. No evidence which is as-built. Track hashes and SolidWorks file references. Two standalone `Part1.SLDPRT` uploads matched SHA-256.

## C05 — Reports and acceptance (OPEN)
`FILE LỎ TẠM.pdf`: 26 exploded assembly drawings, **not** hole-coordinate specification despite filename. `ẢNH CẦN THIẾT.docx` lists 18 assembly steps and intended figures; separate from proof of assembly completion. Zalo teammate indicated fixes planned after physical assembly. Draft reports may be future-tense. Do not report full assembly/test as complete.

## D02 — Data staging
GitHub is PUBLIC: make text context, cleaned code and authorized references available; retain large, duplicate and unreviewed sources in Drive or provenance archive pending clear owner decision. See `sources/UPLOAD_MANIFEST.md`.