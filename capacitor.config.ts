import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bpmruler.app',
  appName: 'BPM Ruler',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
