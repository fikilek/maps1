import { AppleMaps, GoogleMaps } from "expo-maps";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CascadingSelect from "../../components/CascadingSelect";

const cameraPosition = {
  coordinates: {
    latitude: -26.503251966950057,
    longitude: 28.362232281683603,
  },
  zoom: 18,
};

const Map = () => {
  // const { user, setActiveWorkbase } = useAuth();
  const user = {
    activeLocalMunicipalityId: "O4qxiLUOAD2x242twDxT",
  };

  const [workbase, setWorkbase] = useState(null);

  const handleGeoChange = (geo) => {
    const lmId = geo.localMunicipalityId;

    // 🔴 Business rule: must have exactly ONE workbase
    if (!lmId) return;

    // Prevent unnecessary updates
    if (lmId === user.activeLocalMunicipalityId) return;

    // Update auth context
    setWorkbase({
      localMunicipalityId: geo.localMunicipalityId,
      localMunicipalityName: geo.localMunicipalityName, // optional
    });
  };

  if (Platform.OS === "ios") {
    return <AppleMaps.View style={{ flex: 1 }} />;
  } else if (Platform.OS === "android") {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "lightgrey",
            padding: 5,
            justifyContent: "space-around",
          }}
        >
          {/* <Text>Country</Text>
          <Text>Province</Text>
          <Text>DM</Text>
          <Text>LM</Text>
          <Text>Town</Text>
          <Text>Ward</Text> */}
          <CascadingSelect
            initialLocalMunicipalityId={user.activeLocalMunicipalityId}
            onChange={handleGeoChange}
          />
        </View>
        <GoogleMaps.View
          style={{ width: "auto", height: "100%" }}
          cameraPosition={cameraPosition}
          // onMapClick={(e) => {
          //   console.log("Map clicked:", e);
          // }}
          // onMarkerClick={(e) => {
          //   console.log("Marker clicked:", e);
          // }}
          // onCameraMove={(e) => {
          //   console.log("Camera moved:", e);
          // }}
          // onMapLoaded={() => {
          //   console.log("Map loaded");
          // }}
        />
      </SafeAreaView>
    );
  } else {
    return <Text>Maps are only available on Android and iOS</Text>;
  }
};

export default Map;
