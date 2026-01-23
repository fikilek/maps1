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
        "CAMERA", // 🎯 ADD THIS for the Barcode Scanner!
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
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
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],

      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow maps1 to access your location",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app accesses your photos to let you share them with your friends.",
          cameraPermission:
            "Allow $(PRODUCT_NAME) to open the camera to take photos of meters.",
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
