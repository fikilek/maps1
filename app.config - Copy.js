export default ({ config }) => ({
  ...config,
  name: "maps1",
  slug: "maps1",
  owner: "ireps",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "maps1",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    package: "com.ireps.maps1",
    config: {
      googleMaps: { apiKey: "AIzaSyAxgD1BOhVPXgDAYCK_ZG8Gj6CZPRgiHiw" },
    },
  },
  plugins: [
    "expo-router",
    "expo-font",
    "react-native-reanimated/plugin",
    ["expo-camera", { recordAudioPermission: false }],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Allow maps1 to access your location",
      },
    ],
  ],
  extra: {
    googleMapsApiKey: "AIzaSyAxgD1BOhVPXgDAYCK_ZG8Gj6CZPRgiHiw",
    eas: { projectId: "bf458047-0b33-4123-8a11-eea44fce56c2" },
  },
});
