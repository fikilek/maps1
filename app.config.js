export default {
  expo: {
    name: "maps1",
    slug: "maps1",
    owner: "ireps",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "maps1",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.ireps.maps1",
      config: {
        googleMaps: {
          apiKey: "AIzaSyAxgD1BOhVPXgDAYCK_ZG8Gj6CZPRgiHiw",
        },
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES", // 🎯 ADD THIS for Android 13+ support
        "READ_MEDIA_VIDEO",
      ],
    },

    plugins: [
      "expo-router",
      "expo-camera",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" },
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow iREPS to access your location for infrastructure mapping.",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow iREPS to access photos for infrastructure reporting.",
          cameraPermission:
            "Allow iREPS to open the camera for meter inspections.",
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission:
            "Allow iREPS to save infrastructure reports to your device.",
          savePhotosPermission: "Allow iREPS to save captured meter photos.",
          isAccessMediaLocationEnabled: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      googleMapsApiKey: "AIzaSyAxgD1BOhVPXgDAYCK_ZG8Gj6CZPRgiHiw",
      eas: {
        projectId: "bf458047-0b33-4123-8a11-eea44fce56c2",
      },
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    updates: {
      url: "https://u.expo.dev/bf458047-0b33-4123-8a11-eea44fce56c2",
    },
  },
};
