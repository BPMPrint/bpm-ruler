# BPM Ruler

AR-style measurement tool by **BPM Print & Workwear** — measure anything with your phone camera.

## Features

- **Measure** (`/measure`) — full-screen camera view; tap to place two points and get the distance. Calibrate against a known object (credit card 85.6 mm, US quarter, A4 paper, or custom) for real-world mm/cm/inch readings. Draggable endpoints, undo, freeze-frame, camera flip, demo-scene fallback when no camera is available.
- **Screen Ruler** (`/ruler`) — on-screen ruler with draggable caliper lines, live W×H readouts, zero-set, and a 3-step DPI calibration wizard.
- **History** (`/history`) — local-first log of saved measurements with snapshot thumbnails, rename, search/filter/sort, CSV/JSON export, share, and undo-delete.
- **PWA** — installable straight from the browser (Add to Home Screen); works offline after first load.
- **Android app** — native wrapper via Capacitor 7 (appId `com.bpmruler.app`).

## Tech stack

Node.js 20 · React 19 + TypeScript · Vite 7 · Tailwind CSS v3.4 · shadcn/ui · GSAP · Framer Motion · Lenis · Capacitor 7

## Run the web app

```bash
npm install
npm run dev
```

Build for production: `npm run build` (output in `dist/`).

> Note: binary assets (images in `public/`, `gradle-wrapper.jar`, launcher icons) are not in this repo — they are available in the full source bundle. `package-lock.json` is omitted; regenerate with `npm install`.

## Build the Android app

Requires JDK 21 + Android SDK (platform 35, build-tools 35.0.0):

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug   # APK: app/build/outputs/apk/debug/app-debug.apk
```

## Branding

CMYK identity (cyan `#00b0f0` / magenta `#e02090` / yellow `#f0e810`) on near-black — matching the BPM print brand.
