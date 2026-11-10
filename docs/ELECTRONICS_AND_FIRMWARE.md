# Electronics / firmware — evidence snapshot

## Code source
Uploaded archive: `Source Code+ Schematic Diagram RC CAR.zip` (2026-11-10). About 43,340 ZIP file entries; most generated third-party `node_modules`, `__MACOSX`, `.expo` and binaries. **Do not commit raw ZIP or dependencies.** Keep only original `*.ino`, `App.tsx`, `src/*.tsx`, `src/*.ts`, configs and necessary wiring SVGs after review.

## Extracted architecture from source README
- Controller: ESP32 Wi-Fi AP `192.168.4.1`, WebSocket port `81`.
- Driver: IBT-2 / BTS7960 with motor PWM on GPIO 25/26 and enable on 27/33.
- Steering: micro servo on GPIO 32; verify installed servo against earlier MG996R reference.
- Encoder: opto 20-slot signal on GPIO 13.
- XL4015 step-down nominal 5 V for servo electronics; measure output safely before connecting a servo.
- App: React Native Expo mobile cockpit and control, steering/throttle/brake, telemetry RPM/km/h/ODO.

## Not verified
No compiled/bench-tested firmware, actual wiring continuity, motor current, installed component labels, encoder placement or true gear ratio are evidenced by source files. Document explicitly before testing.

## Safety / deployment
- Firmware source archive contains a demo-style AP password. Do **not** publish an operational password; extract credential into local configuration or replace with a placeholder before a public push.
- Verify electronics wiring and module voltage requirements from actual hardware and component datasheets. A README's pin/voltage table is a claim to check, not an electrical safety certificate.
- Clamp servo travel and limit motor power before any powered assembly test.
- Correct speed/odometer calculation only after encoder placement and pulse-per-wheel-turn ratio are validated.

## Source import completed (2026-11-10)
21 cleaned source files have been committed under `firmware/` and `app/expo-motor-controller/`: one Arduino `.ino`, 11 React Native TypeScript/TSX files, configuration and package-lock, 4 wiring SVG diagrams, and the source README. Vendor `node_modules`, macOS metadata and Expo caches were excluded. The placeholder AP password differs from the source ZIP. This code is **not yet compiled/bench-tested**; verify it on a safe bench setup before hardware operation. See `sources/CODE_IMPORT_MANIFEST.md`.