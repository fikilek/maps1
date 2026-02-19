import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMemo, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Modal, Portal, Searchbar, Surface } from "react-native-paper";
import { useGeo } from "../../src/context/GeoContext";
import { useMap } from "../../src/context/MapContext";
import { useWarehouse } from "../../src/context/WarehouseContext";

export default function GeoCascadingSelector() {
  const { geoState, updateGeo } = useGeo();
  const { filtered, all } = useWarehouse();
  // console.log(`filtered?.prems`, filtered?.prems);

  const { flyTo } = useMap();

  const [showWards, setShowWards] = useState(false);
  const [showErfs, setShowErfs] = useState(false);
  const [showPrems, setShowPrems] = useState(false);
  const [showMeters, setShowMeters] = useState(false);

  const [erfSearchQuery, setErfSearchQuery] = useState("");
  const [premSearchQuery, setPremSearchQuery] = useState("");
  const [meterSearchQuery, setMeterSearchQuery] = useState("");

  const {
    selectedLm,
    selectedWard,
    selectedErf,
    selectedPremise,
    selectedMeter,
  } = geoState;

  // --- 🎯 TACTICAL FILTERS ---
  const filteredErfs = useMemo(() => {
    const base = filtered?.erfs || [];
    if (!erfSearchQuery) return base;
    const q = erfSearchQuery.toLowerCase();
    return base.filter((e) => `${e?.erfNo} ${e?.id}`.toLowerCase().includes(q));
  }, [erfSearchQuery, filtered?.erfs]);

  const filteredPrems = useMemo(() => {
    const base = filtered?.prems || [];
    if (!premSearchQuery) return base;
    const q = premSearchQuery.toLowerCase();
    return base.filter((p) => {
      const addr = p?.address;
      return `${p?.id} ${addr?.strNo} ${addr?.strName} ${p?.propertyType?.type} ${p?.erfNo}`
        .toLowerCase()
        .includes(q);
    });
  }, [premSearchQuery, filtered?.prems]);

  const filteredMetersList = useMemo(() => {
    const base = filtered?.meters || [];
    if (!meterSearchQuery) return base;
    const q = meterSearchQuery.toLowerCase();
    return base.filter((m) =>
      m?.ast?.astData?.astNo?.toLowerCase().includes(q),
    );
  }, [meterSearchQuery, filtered?.meters]);

  // --- ✈️ SELECTION HANDLERS ---
  const handleLmReset = () => {
    updateGeo({ selectedLm, lastSelectionType: "LM" });
    setShowWards(false);
  };
  const selectWard = (ward) => {
    updateGeo({ selectedWard: ward, lastSelectionType: "WARD" });
    setShowWards(false);
  };
  const selectErf = (erf) => {
    updateGeo({ selectedErf: erf, lastSelectionType: "ERF" });
    setShowErfs(false);
  };

  const selectPremise = (prem) => {
    console.log(`📡 [GCS]: Initiating Double-Tap for Premise: ${prem.id}`);

    // 1. Find the parent Erf (following the 'id' rule)
    const parentErf = all?.erfs?.find((e) => e.id === prem?.erfId);

    // 🎯 TAP 1: Select the Erf Parent
    // This satisfies the cascade rule: clears old children and sets HUD to Erf context.
    updateGeo({
      selectedErf: parentErf || null,
      lastSelectionType: "ERF",
    });

    // 🎯 TAP 2: Select the Premise
    // This lands the specific target. It survives the "wipe" of the first call
    // because it happens immediately after.
    updateGeo({
      selectedPremise: prem,
      lastSelectionType: "PREMISE",
    });

    setShowPrems(false);
  };

  const selectMeter = (meter) => {
    const pId = meter?.accessData?.premise?.id;
    const parentPremise = all?.prems?.find((p) => p?.id === pId);
    const parentErf = all?.erfs?.find((e) => e.id === parentPremise?.erfId);

    // select erf
    updateGeo({
      selectedErf: parentErf || null,
      lastSelectionType: "ERF",
    });

    // select premise
    updateGeo({
      selectedPremise: parentPremise || null,
      lastSelectionType: "PREMISE",
    });

    // select meter
    updateGeo({
      selectedMeter: meter,
      lastSelectionType: "METER",
    });

    setMeterSearchQuery("");
    setShowMeters(false);
  };

  const handleCenterOnMe = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      flyTo(
        [
          {
            latitude: location?.coords?.latitude,
            longitude: location?.coords?.longitude,
          },
        ],
        100,
      );
    } catch (error) {
      console.error("❌ Pilot: GPS acquisition failed", error);
    }
  };

  // --- 🏷️ LABEL CONSTRUCTION ---
  const lmNameStr = `${selectedLm?.name || "LM"}`;
  const wardNameStr = `${selectedWard?.name || "All Wards"}`;
  const adrLn1 = selectedPremise?.address
    ? `${selectedPremise?.address?.strNo} ${selectedPremise?.address?.strName}`
    : "Premise";
  const adrLn2 = selectedPremise?.address
    ? `${selectedPremise?.address?.strType}`
    : "";
  const meterNoStr = selectedMeter?.ast?.astData?.astNo
    ? `Mtr ${selectedMeter?.ast?.astData?.astNo}`
    : "Meter";

  const erfLabelStr = selectedErf?.erfNo
    ? `Erf ${selectedErf?.erfNo} (W${selectedErf?.admin?.ward?.name?.replace(/\D/g, "") || "?"})`
    : "Erf";

  return (
    <>
      <Portal>
        {/* WARD MODAL */}
        <Modal
          visible={showWards}
          onDismiss={() => setShowWards(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text
              style={styles.modalTitle}
            >{`${lmNameStr} : Select Ward`}</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TouchableOpacity
                style={[
                  styles.wardItem,
                  !selectedWard && { backgroundColor: "#f1f5f9" },
                ]}
                onPress={handleLmReset}
              >
                <Text
                  style={[
                    styles.wardText,
                    { fontWeight: "800", color: "#6366f1" },
                  ]}
                >
                  All Wards (Reset Filter)
                </Text>
              </TouchableOpacity>
              {filtered?.wards?.map((ward, index) => (
                <TouchableOpacity
                  key={ward?.id}
                  style={[
                    styles.wardItem,
                    selectedWard?.id === ward?.id && {
                      backgroundColor: "#eff6ff",
                    },
                  ]}
                  onPress={() => selectWard(ward)}
                >
                  <Text
                    style={[
                      styles.wardText,
                      selectedWard?.id === ward?.id && {
                        fontWeight: "bold",
                        color: "#2563eb",
                      },
                    ]}
                  >
                    {ward?.name || ward?.code || `Ward ${index + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Surface>
        </Modal>

        {/* ERFS MODAL */}
        <Modal
          visible={showErfs}
          onDismiss={() => setShowErfs(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text
              style={styles.modalTitle}
            >{`Erfs (${filteredErfs?.length})`}</Text>
            <Searchbar
              placeholder="Search Erf No..."
              onChangeText={setErfSearchQuery}
              value={erfSearchQuery}
              style={styles.searchBar}
            />
            <TouchableOpacity
              style={styles.wardItem}
              onPress={() => {
                updateGeo({
                  // selectedWard: selectedWard,
                  selectedErf: null,
                  lastSelectionType: "WARD",
                });
                setShowErfs(false);
              }}
            >
              <Text
                style={[
                  styles.wardText,
                  { fontWeight: "800", color: "#6366f1" },
                ]}
              >
                All Erfs (Reset Filter)
              </Text>
            </TouchableOpacity>
            <FlatList
              data={filteredErfs}
              keyExtractor={(item) => item?.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item: e }) => (
                <TouchableOpacity
                  style={[
                    styles.wardItem,
                    selectedErf?.id === e?.id && { backgroundColor: "#eff6ff" },
                  ]}
                  onPress={() => selectErf(e)}
                >
                  <Text
                    style={[
                      styles.wardText,
                      selectedErf?.id === e?.id && {
                        fontWeight: "bold",
                        color: "#2563eb",
                      },
                    ]}
                  >
                    {`ERF ${e?.erfNo} `}
                    <Text
                      style={{ fontSize: 12, color: "#94a3b8" }}
                    >{`(W${e?.admin?.ward?.name?.replace(/\D/g, "") || "?"})`}</Text>
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Surface>
        </Modal>

        {/* PREMISE MODAL */}
        <Modal
          visible={showPrems}
          onDismiss={() => setShowPrems(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text
              style={styles.modalTitle}
            >{`Premises (${filteredPrems?.length})`}</Text>
            <Searchbar
              placeholder="Search address or Erf..."
              onChangeText={setPremSearchQuery}
              value={premSearchQuery}
              style={styles.searchBar}
            />
            <TouchableOpacity
              style={styles.wardItem}
              onPress={() => {
                updateGeo({
                  // selectedErf: selectedErf,
                  selectedPremise: null,
                  lastSelectionType: "ERF",
                });
                setShowPrems(false);
              }}
            >
              <Text
                style={[
                  styles.wardText,
                  { fontWeight: "800", color: "#6366f1" },
                ]}
              >
                All Premises (Reset Filter)
              </Text>
            </TouchableOpacity>
            <FlatList
              data={filteredPrems}
              keyExtractor={(item) => item?.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item: p }) => {
                const erfId = p?.erfId || "";
                const erf = filtered?.erfs?.find((erf) => erf?.id === erfId);
                const wardDigits = erf?.admin?.ward?.name;

                return (
                  <TouchableOpacity
                    style={[
                      styles.wardItem,
                      selectedPremise?.id === p?.id && {
                        backgroundColor: "#eff6ff",
                      },
                    ]}
                    onPress={() => selectPremise(p)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.wardText,
                          selectedPremise?.id === p?.id && {
                            fontWeight: "bold",
                            color: "#2563eb",
                          },
                        ]}
                      >
                        {`${p?.propertyType?.type || "Res"} - ${p?.address?.strNo} ${p?.address?.strName}`}
                      </Text>
                      <Text style={styles.subLabel}>
                        {`Erf ${p?.erfNo || "N/A"} - ${wardDigits}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Surface>
        </Modal>

        {/* METERS MODAL */}
        <Modal
          visible={showMeters}
          onDismiss={() => setShowMeters(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text
              style={styles.modalTitle}
            >{`Meters (${filteredMetersList?.length})`}</Text>
            <Searchbar
              placeholder="Search meter no..."
              onChangeText={setMeterSearchQuery}
              value={meterSearchQuery}
              style={styles.searchBar}
            />
            <TouchableOpacity
              style={[
                styles.wardItem,
                !selectedMeter && { backgroundColor: "#f1f5f9" },
              ]}
              onPress={() => {
                updateGeo({
                  selectedMeter: null,
                  lastSelectionType: "METER",
                });
                setMeterSearchQuery("");
                setShowMeters(false);
              }}
            >
              <Text
                style={[
                  styles.wardText,
                  { fontWeight: "800", color: "#6366f1" },
                ]}
              >
                All Meters (Reset Selection)
              </Text>
            </TouchableOpacity>
            <FlatList
              data={filteredMetersList}
              keyExtractor={(item) => item?.id}
              style={{ maxHeight: 400 }}
              renderItem={({ item: m }) => {
                const addr = m?.accessData?.premise?.address || "No Address";
                const erfNo = m?.accessData?.erfNo || "N/A";
                const erfId = m?.accessData?.erfId || "";
                const erf = filtered?.erfs?.find((erf) => erf?.id === erfId);
                const wardName = erf?.admin?.ward?.name;
                const ward = wardName?.split(" ").pop() || "?";
                return (
                  <TouchableOpacity
                    style={[
                      styles.wardItem,
                      selectedMeter?.id === m?.id && {
                        backgroundColor: "#eff6ff",
                      },
                    ]}
                    onPress={() => selectMeter(m)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <MaterialCommunityIcons
                        name={
                          m?.meterType === "water" ? "water" : "lightning-bolt"
                        }
                        size={18}
                        color={m?.meterType === "water" ? "#3b82f6" : "#eab308"}
                        style={{ marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.wardText,
                            selectedMeter?.id === m?.id && {
                              fontWeight: "bold",
                              color: "#2563eb",
                            },
                          ]}
                        >
                          {m?.ast?.astData?.astNo}
                        </Text>
                        <Text style={styles.subLabel}>
                          {`${addr} - Erf ${erfNo} - W${ward}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Surface>
        </Modal>
      </Portal>

      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            icon="city"
            onPress={handleLmReset}
            style={styles.pill}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >
            {lmNameStr}
          </Button>
          <View style={{ width: 6 }} />
          <Button
            mode="contained"
            icon="layers-outline"
            onPress={() => setShowWards(true)}
            style={styles.pill}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >
            {wardNameStr}
          </Button>
          <View style={{ width: 6 }} />
          {/* 🎯 THE REFINED 'CENTER ME' BUTTON */}
          <TouchableOpacity
            style={[styles.pill, styles.locationButtonRowVersion]}
            onPress={handleCenterOnMe}
            activeOpacity={0.7}
          >
            <View style={styles.centerMeContent}>
              <MaterialCommunityIcons
                name="crosshairs-gps" // 🛰️ Changed to a more tactical GPS icon
                size={20}
                color="white"
              />
              <Text style={styles.locationTextSmall}>ME</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.buttonRow, { marginTop: 8 }]}>
          <Button
            mode="contained"
            icon="map-marker-path"
            onPress={() => setShowErfs(true)}
            style={styles.pill}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >
            {erfLabelStr}
          </Button>
          <View style={{ width: 6 }} />
          <Button
            mode="contained"
            icon="home-city"
            onPress={() => setShowPrems(true)}
            style={styles.pill}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >{`${adrLn1} ${adrLn2}`}</Button>
          <View style={{ width: 6 }} />
          <Button
            mode="contained"
            icon="water-pump"
            onPress={() => setShowMeters(true)}
            style={styles.pill}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >
            {meterNoStr}
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: -15,
    left: 10,
    right: 10,
    zIndex: 100,
  },
  buttonRow: { flexDirection: "row", alignItems: "center" },
  // pill: {
  //   flex: 1,
  //   borderRadius: 12,
  //   backgroundColor: "rgba(241, 245, 249, 0.95)",
  //   elevation: 4,
  //   borderWidth: 1,
  //   borderColor: "rgba(203, 213, 225, 0.5)",
  // },
  // buttonContent: { height: 52 },
  labelText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 0.1,
  },
  // locationButtonRowVersion: {
  //   backgroundColor: "#ef4444",
  //   flexDirection: "row",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // locationTextSmall: {
  //   color: "white",
  //   fontSize: 11,
  //   fontWeight: "900",
  //   marginLeft: 4,
  // },
  modalContainer: { padding: 10, justifyContent: "center" },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#1e293b",
  },
  wardItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  wardText: { fontSize: 15, color: "#334155" },
  subLabel: { fontSize: 12, color: "#64748b", fontWeight: "500", marginTop: 2 },
  searchBar: { marginBottom: 10, borderRadius: 10, backgroundColor: "#f8fafc" },

  pill: {
    flex: 1,
    borderRadius: 14, // Slightly rounder for modern iREPS look
    backgroundColor: "rgba(241, 245, 249, 0.98)",
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.8)",
    overflow: "hidden", // Ensures background colors don't bleed past borders
  },

  // 🛰️ CENTER ME SPECIFIC CSS
  locationButtonRowVersion: {
    backgroundColor: "#ef4444", // Tactical Red
    borderColor: "#dc2626",
    borderWidth: 1,
  },

  centerMeContent: {
    height: 52, // 🎯 MATCHES buttonContent height exactly
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  locationTextSmall: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 4,
    letterSpacing: 0.5,
  },

  buttonContent: {
    height: 52, // Ensures uniform height across the whole row
  },
});
