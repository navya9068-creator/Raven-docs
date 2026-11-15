// Capacitor Configuration for Commercial Android (AAB) and iOS (IPA) Distribution
// Usage after running `npm run build`:
//   npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
//   npx cap sync
//   npx cap open android  -> Build Signed App Bundle (.aab) for Google Play Console
//   npx cap open ios      -> Archive .ipa in Xcode for App Store Connect

const capacitorConfig = {
  appId: 'com.darkacademia.study',
  appName: 'DARK ACADEMIA',
  webDir: 'dist',
  backgroundColor: '#211A18',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: '#211A18',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#211A18',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_crest',
      iconColor: '#80664B',
    },
  },
};

export default capacitorConfig;
