import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.internflow.app',
  appName: 'InternFlow',
  webDir: 'out', // Fallback, though we are using server.url
  server: {
    // ⚠️ IMPORTANT: For local testing on an Android Emulator, use 'http://10.0.2.2:3000'
    // For local testing on a physical device, use your computer's local IP 'http://192.168.x.x:3000'
    // For production, replace with your live Vercel/VPS URL (e.g., 'https://internflow.college.edu')
    url: 'http://localhost:3000',
    cleartext: true, // Allow HTTP traffic for local development
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
