# BPM Ruler — AR Measurement Tool

A web app (React 19 + Vite 7 + Tailwind CSS + shadcn/ui) with a Capacitor 7 Android wrapper (appId `com.bpmruler.app`).

## Features

- **Camera measure with calibration** — measure real-world objects through the camera using reference-object calibration
- **Screen ruler** — on-screen ruler with calibration wizard and reference guides
- **History** — saved measurements with CSV/JSON export
- **PWA installable** — install to home screen as a Progressive Web App

## Build

```bash
npm install && npm run build
```

## Android

Requires JDK 21 and Android SDK 35.

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Note

Binary assets (images, APK) are excluded from this import. The APK is distributed separately.
