import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useGeo } from "../../src/context/GeoContext";
import { erfMemory } from "../../src/storage/erfMemory";

export default function ErfDebugInspector() {
  const { geoState } = useGeo();
  const { erfId } = geoState;

  const rawGeoData = useMemo(() => {
    if (!erfId) return null;
    return erfMemory.getErfGeo(erfId);
  }, [erfId]);

  if (!erfId) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 100,
        left: 10,
        right: 10,
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: 10,
        borderRadius: 8,
        zIndex: 9999,
      }}
    >
      <Text style={{ color: "#00ff00", fontWeight: "bold", marginBottom: 4 }}>
        🔍 MMKV INSPECTOR: {erfId}
      </Text>
      <ScrollView style={{ maxHeight: 150 }}>
        <Text style={{ color: "#fff", fontSize: 10, fontFamily: "monospace" }}>
          {rawGeoData
            ? JSON.stringify(rawGeoData, null, 2)
            : "❌ NO DATA FOUND IN MMKV"}
        </Text>
      </ScrollView>
      {rawGeoData && !rawGeoData.bbox && (
        <Text style={{ color: "#ff4444", marginTop: 5, fontWeight: "bold" }}>
          ⚠️ PIPELINE ERROR: BBOX MISSING IN STORAGE
        </Text>
      )}
    </View>
  );
}
