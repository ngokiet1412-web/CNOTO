# CAD verification procedure — do not skip

1. Extract `BTL CNOTO.zip` without flattening directory structure. Do not include temporary lock files in releases.
2. Open `Assem model.SLDASM` in a compatible licensed SolidWorks installation.
3. Inspect **all missing references** and resolve them with Pack and Go; do not silently substitute similarly named `Part1` files.
4. Inspect suppressions, mates, degrees of freedom and mass properties; force full rebuild (`Ctrl+Q`). Record errors/warnings.
5. Run interference detection, excluding known intentional fits; list each collision with part references, measurement and decision.
6. Verify the floor, motor mount, front/rear suspension and steering against real-vehicle photos and reference measurements.
7. Export full assembly as STEP AP242 (or AP214 if unsupported), keeping original `SLDASM` unchanged. Export 2D dimensioned views where required.
8. Independently import exported STEP, count bodies and confirm vehicle envelope/wheelbase/track. Attach results.
9. Check consistency with 26 assembly drawings from `FILE LỎ TẠM.pdf`; exploded views alone do not establish exact mates.
10. Release new filenames with date/revision; retain the older candidate files in archive.

**Previous result (limited):** seven STEP sources loaded and 43 solid bodies survived one inspection export. This is a geometry IO sanity check ONLY. No proven correct whole-vehicle arrangement.

## Minimum CAD report
`ASSEMBLY_REPORT.md`: date, tool/version, input SHA, missing refs, part list, rebuild, interferences, exact envelope, datum, wheelbase/track, output SHA, screenshots, reviewer.