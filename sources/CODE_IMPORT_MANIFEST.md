# Source code import report — 2026-11-10

**Original:** `Source Code+ Schematic Diagram RC CAR.zip` (157,569,863 bytes; SHA256 `46595f77ed9661fe1d2c1ee815a253e0c1cb2049edd6ed84b971e81164de02be`).

**Committed:** 21 original/project source files and wiring SVGs, preserving relative code paths:
- Arduino ESP32 firmware: [esp32_ibt2_controller.ino](../firmware/esp32_ibt2_controller.ino)
- Expo app: [App.tsx](../app/expo-motor-controller/App.tsx), components in [src/](../app/expo-motor-controller/src/), `index.ts`, `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`.
- Editable wiring diagrams (SVG): [firmware/](../firmware/) and included README.

**Excluded:** ~43k original archive entries dominated by copied `node_modules`, `__MACOSX`, `.expo`, temporary and binary build artifacts. Run `npm ci` locally when needed (the `package-lock.json` is included).

**Intentional sanitization:** the original ESP32 demo AP password was changed from `12345678` to `CHANGE_ME_BEFORE_USE`, and associated source documentation/app display was updated. There were no claims of tested communication after this change. Set a new private password and re-test on hardware. The original source archive remains unchanged in external evidence storage.

**Caution:** Source import does not equal a successful compile, electronic acceptance or integration test. `AGENTS.md` and `docs/DECISIONS_AND_CONFLICTS.md` define unresolved design differences.