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
import { getSafeCoords, useMap } from "../../src/context/MapContext";
import { useWarehouse } from "../../src/context/WarehouseContext";

export default function GeoCascadingSelector() {
  const { geoState, setGeoState } = useGeo();
  const { all } = useWarehouse();
  // console.log(`GeoCascadingSelector----all?.prems`, all?.prems);
  // console.log(`GeoCascadingSelector----all?.meters`, all?.meters);

  const [searchQuery, setSearchQuery] = useState("");
  const [showErfs, setShowErfs] = useState(false);
  // console.log(`GeoCascadingSelector----showErfs`, showErfs);

  const [showMeters, setShowMeters] = useState(false);
  const [meterSearchQuery, setMeterSearchQuery] = useState("");
  const filteredMeters = (all?.meters || []).filter((m) => {
    const mNo = m?.ast?.astData?.astNo || "";
    return mNo.toLowerCase().includes(meterSearchQuery.toLowerCase());
  });

  const [erfSearchQuery, setErfSearchQuery] = useState("");
  // console.log(`GeoCascadingSelector----erfSearchQuery`, erfSearchQuery);

  const { flyTo } = useMap();
  // const lmId = geoState?.selectedLm?.id;

  const { selectedErf, selectedPremise } = geoState;
  // console.log(`GeoCascadingSelector----selectedErf`, selectedErf);

  const [showWards, setShowWards] = useState(false);

  const [showPrems, setShowPrems] = useState(false);
  // console.log(`GeoCascadingSelector----showPrems`, showPrems);

  const activeLm = geoState?.selectedLm;
  const activeWard = geoState?.selectedWard;

  const lmNameStr = `${activeLm?.name || "LM"}`;
  const wardNameStr = `${activeWard?.name || "All Wards"}`;
  const premiseIdStr = selectedPremise?.id
    ? `${selectedPremise.id}`
    : "Premise";

  // 🏗️ ADDRESS CONSTRUCTION
  const addr = selectedPremise?.address;
  const adrLn1 = addr ? `${addr.strNo || ""} ${addr.strName}`.trim() : "NO ADR";
  const adrLn2 = addr ? ` ${addr.strType || ""}`.trim() : "NO ADR";

  // 🎯 TACTICAL ERF FILTER: Uses 'filtered.erfs' from the Warehouse
  const filteredErfs = useMemo(() => {
    if (!erfSearchQuery) return all?.erfs || [];
    const query = erfSearchQuery.toLowerCase();
    return all.erfs.filter((e) => {
      const searchString = `${e.erfNo} ${e.id}`.toLowerCase();
      return searchString.includes(query);
    });
  }, [erfSearchQuery, all?.erfs]);

  // ✈️ 3. ERF SELECTION & JUMP
  const selectErf = (erf) => {
    // console.log(`GeoCascadingSelector----erf`, erf);

    setGeoState((prev) => ({ ...prev, selectedErf: erf }));
    setShowErfs(false);
    setErfSearchQuery("");
  };

  // 🛰️ DIRECT SOURCE: Fetch ALL wards for this LM from the API
  // const { data: fullWardsList } = useGetWardsByLocalMunicipalityQuery(lmId, {
  //   skip: !lmId,
  // });

  // ✈️ 1. LM JUMP LOGIC (RESTORED)
  const handleLmJump = () => {
    if (!activeLm) return;
    const lmEntry = all?.geoLibrary?.[activeLm.id] || activeLm;
    const coords = getSafeCoords(lmEntry.geometry || lmEntry);
    if (coords.length > 0) flyTo(coords, 100); // Wider padding for LM
  };

  // ✈️ 2. WARD SELECTION & JUMP
  const selectWard = (ward) => {
    // console.log(`GeoCascadingSelector----selectWard ----ward`, ward);

    setGeoState((prev) => ({ ...prev, selectedWard: ward }));
    setShowWards(false);

    const wardEntry = all?.geoLibrary?.[ward.id] || ward;

    const coords = getSafeCoords(wardEntry.geometry || wardEntry);
    // console.log(
    //   `GeoCascadingSelector --selectWard() --coords?.length`,
    //   coords?.length,
    // );

    if (coords.length > 0) flyTo(coords, 20); // Tighter padding for Ward
  };

  const selectPremise = (prem) => {
    console.log(`GeoCascadingSelector ---selectMeter ---prem`, prem);
    setGeoState((prev) => ({ ...prev, selectedPremise: prem }));
    setShowPrems(false);

    const centroid = prem?.geometry?.centroid;

    // 🏛️ THE TRANSFORMATION
    if (centroid && Array.isArray(centroid) && centroid.length === 2) {
      // 🎯 We turn [lat, lng] into [{ latitude, longitude }]
      const formattedCoord = [
        {
          latitude: centroid[0],
          longitude: centroid[1],
        },
      ];

      console.log(
        `✈️ Pilot: Reformatting Centroid for Flight...`,
        formattedCoord,
      );

      // Now we fly. Coords.length will be 1, not 2!
      flyTo(formattedCoord, 100);
    }
  };

  const selectMeter = (meter) => {
    console.log(`GeoCascadingSelector ---selectMeter ---meter`, meter);
    const gps = meter?.ast?.location?.gps;

    if (gps?.lat) {
      setGeoState((prev) => ({
        ...prev,
        selectedMeter: meter,
        // 🎯 Vital: Lock the parent Erf so the map highlights the property
        selectedErf: { id: meter.accessData?.erfId },
      }));

      // 🚀 Flight Plan
      flyTo([{ latitude: gps.lat, longitude: gps.lng }], 70);
    }
  };

  // 🎯 TACTICAL FILTER ENGINE
  const filteredList = useMemo(() => {
    if (!searchQuery) return all.prems;

    const query = searchQuery.toLowerCase();
    return all.prems.filter((p) => {
      const addr = p?.address;
      const searchString = `
      ${p.id} 
      ${addr?.strNo} 
      ${addr?.strName} 
      ${p?.propertyType?.type}
    `.toLowerCase();

      return searchString.includes(query);
    });
  }, [searchQuery, all?.prems]);

  // Inside GeoCascadingSelector component
  const handleCenterOnMe = async () => {
    try {
      console.log("🛰️ Pilot: Requesting GPS lock...");

      // 🛡️ Guard 1: Check Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("⚠️ Pilot: Location permission denied.");
        return;
      }

      // 🛡️ Guard 2: High-Accuracy Lock
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log(`🎯 Pilot: User position secured: ${latitude}, ${longitude}`);

      // ✈️ Execute the Flight (Target: User's 10-meter radius)
      // We wrap it in an array to satisfy our flyTo validator
      flyTo([{ latitude, longitude }], 100);
    } catch (error) {
      console.error("❌ Pilot: GPS acquisition failed", error);
    }
  };

  // 🎯 Data Extraction for the Labels
  const selectedMeter = geoState?.selectedMeter;
  const meterNoStr = selectedMeter?.ast?.astData?.astNo
    ? `Mtr ${selectedMeter.ast.astData.astNo}`
    : "Meter";

  // 🏷️ Using the logic we built yesterday for Erf + Ward No
  const rawWardName = selectedErf?.admin?.ward?.name || "";
  const wardNoDigits = rawWardName.replace(/\D/g, "");
  const erfLabelStr = selectedErf?.erfNo
    ? `${selectedErf.erfNo}${wardNoDigits ? ` (W${wardNoDigits})` : ""}`
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
            <Text style={styles.modalTitle}>
              {/* 🎯 SANITIZED TITLE */}
              {`${lmNameStr} : All Wards`}
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {all?.wards?.map((ward, index) => {
                // console.log(`GeoCascadingSelector----modal ----ward`, ward);

                // 🛡️ Force item text to be a string
                const wardLabel = `${ward?.name || ward?.code || `Ward ${index + 1}`}`;
                // console.log(
                //   `GeoCascadingSelector----modal ----wardLabel`,
                //   wardLabel,
                // );
                return (
                  <TouchableOpacity
                    key={`ward-full-${ward?.id || index}`}
                    style={styles.wardItem}
                    onPress={() => selectWard(ward)}
                  >
                    <Text style={styles?.wardText}>{wardLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Surface>
        </Modal>

        {/* PREMISE MODAL */}
        <Modal
          visible={showPrems}
          onDismiss={() => {
            setShowPrems(false);
            setSearchQuery("");
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {`Premises (${filteredList.length})`}
            </Text>

            <Searchbar
              placeholder="Search..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            <FlatList
              data={filteredList}
              keyExtractor={(item, index) => `${item.id || index}`}
              style={{ maxHeight: 400 }}
              renderItem={({ item: p }) => {
                const addr = p?.address;
                const formattedAddr = addr
                  ? `${addr.strNo} ${addr.strName} ${addr.strType}`
                  : "No Address";
                const pType = `${p?.propertyType?.type || "Unknown"}`;
                return (
                  <TouchableOpacity
                    style={styles.wardItem}
                    onPress={() => {
                      console.log(
                        `GeoCascadingSelector ---selectMeter ---p`,
                        p,
                      );
                      selectPremise(p);
                    }}
                  >
                    <Text
                      style={styles.wardText}
                    >{`${pType} - ${formattedAddr}`}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Surface>
        </Modal>

        <Modal
          visible={showErfs}
          onDismiss={() => setShowErfs(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text
              style={styles.modalTitle}
            >{`Erfs (${filteredErfs.length})`}</Text>
            <Searchbar
              placeholder="Search Erf No..."
              onChangeText={setErfSearchQuery}
              value={erfSearchQuery}
              style={styles.searchBar}
            />
            <FlatList
              data={filteredErfs}
              keyExtractor={(item) => `${item?.id}`}
              style={{ maxHeight: 400 }}
              renderItem={({ item: e }) => {
                // 🛡️ 1. Extract Ward Digits from "Ward X"
                const rawWardName = e?.admin?.ward?.name || "";
                const wardNo = rawWardName.replace(/\D/g, "");

                // 🛡️ 2. Build the display string
                const displayLabel = `ERF ${e?.erfNo || "N/A"}${wardNo ? ` (W${wardNo})` : ""}`;

                return (
                  <TouchableOpacity
                    style={styles.wardItem}
                    onPress={() => selectErf(e)}
                  >
                    {/* <Text style={styles.wardText}>{displayLabel}</Text> */}
                    <Text style={styles.wardText}>
                      {`ERF ${e?.erfNo || "N/A"} `}
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          fontWeight: "400",
                        }}
                      >
                        {wardNo ? `(W${wardNo})` : ""}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Surface>
        </Modal>

        <Modal
          visible={showMeters}
          onDismiss={() => setShowMeters(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {`Meters (${filteredMeters.length})`}
            </Text>

            <Searchbar
              placeholder="Search Meter No..."
              onChangeText={setMeterSearchQuery}
              value={meterSearchQuery}
              style={styles.searchBar}
            />

            <FlatList
              data={filteredMeters}
              keyExtractor={(item) => `${item?.id}`}
              style={{ maxHeight: 400 }}
              renderItem={({ item: m }) => {
                // 🛡️ 1. Extract Parent Info for metadata
                const erfNo = m?.accessData?.erfNo || "N/A";
                const meterNo = m?.ast?.astData?.astNo || "N/A";
                const isWater = m?.meterType === "water";

                return (
                  <TouchableOpacity
                    style={styles.wardItem} // Reusing the same "Sexy" style
                    onPress={() => {
                      // ✈️ Trigger the Global Selection logic
                      console.log(
                        `GeoCascadingSelector ---selectMeter ---m`,
                        m,
                      );

                      selectMeter(m);
                      setShowMeters(false);
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <MaterialCommunityIcons
                        name={isWater ? "water" : "lightning-bolt"}
                        size={18}
                        color={isWater ? "#3b82f6" : "#eab308"}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.wardText}>
                        {`MTR ${meterNo} `}
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            fontWeight: "400",
                          }}
                        >
                          {` (ERF ${erfNo})`}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Surface>
        </Modal>
      </Portal>

      <View style={styles.container}>
        {/* 🏛️ ROW 1: THE ADMINISTRATION & PILOT */}
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            icon="city"
            onPress={handleLmJump}
            style={[styles.pill, styles.lmPill]}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
            numberOfLines={1}
          >
            {lmNameStr}
          </Button>

          <View style={{ width: 6 }} />

          <Button
            mode="contained"
            icon="layers-outline"
            onPress={() => setShowWards(true)}
            style={[styles.pill, styles.wardPill]}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >
            {wardNameStr}
          </Button>

          <View style={{ width: 6 }} />

          {/* 🛰️ THE "ME" BEACON */}
          <TouchableOpacity
            style={[styles.pill, styles.locationButtonRowVersion]}
            onPress={handleCenterOnMe}
          >
            <MaterialCommunityIcons
              name="account-search"
              size={20}
              color="white"
            />
            <Text style={styles.locationTextSmall}>ME</Text>
          </TouchableOpacity>
        </View>

        {/* 🏛️ ROW 2: THE INFRASTRUCTURE (The Drill-Down) */}
        <View style={[styles.buttonRow, { marginTop: 8 }]}>
          <Button
            mode="contained"
            icon="map-marker-path"
            onPress={() => setShowErfs(true)}
            style={[styles.pill, styles.erfPill]}
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
            style={[styles.pill, styles.premPill]}
            labelStyle={styles.labelText}
            contentStyle={styles.buttonContent}
          >
            {adrLn1}
          </Button>

          <View style={{ width: 6 }} />

          {/* ⚡ THE ASSET SELECTOR */}
          <Button
            mode="contained"
            icon="water-pump"
            onPress={() => setShowMeters(true)}
            style={[styles.pill, styles.meterPill]}
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
  buttonHeight: { height: 54 },
  modalContainer: { padding: 20, justifyContent: "center" },
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  wardText: { fontSize: 16, color: "#334155" },

  // container: {
  //   position: "absolute",
  //   bottom: -15,
  //   left: 10,
  //   right: 10,
  //   flexDirection: "row", // 🎯 The Split
  //   zIndex: 100,
  //   gap: 8,
  // },
  leftColumn: {
    flex: 4, // Takes most of the width
    flexDirection: "column",
  },
  // buttonRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  // },
  locationButton: {
    flex: 1,
    backgroundColor: "#7894aa",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    borderWidth: 2,
    borderColor: "white",
  },
  locationText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },

  // pill: {
  //   flex: 1,
  //   borderRadius: 14, // Slightly rounder for that "sexy" look
  //   backgroundColor: "rgba(241, 245, 249, 0.95)", // 🛡️ Light Slate Grey / 95% Opaque
  //   elevation: 3,
  //   borderWidth: 0.5,
  //   borderColor: "rgba(42, 57, 75, 0.5)", // Soft border
  // },
  lmPill: {},
  wardPill: {},
  erfPill: {},
  premPill: {},

  labelText: {
    fontSize: 11, // Slightly smaller for elegance
    fontWeight: "800",
    color: "#334155", // Deep Slate for readability against light grey
    letterSpacing: 0.3,
  },

  // buttonContent: {
  //   height: 50,
  // },

  container: {
    position: "absolute",
    bottom: 25,
    left: 10,
    right: 10,
    zIndex: 100,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(241, 245, 249, 0.95)", // Sexy Light Grey
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(203, 213, 225, 0.5)",
  },
  buttonContent: {
    height: 52,
  },
  locationButtonRowVersion: {
    backgroundColor: "#ef4444", // Sovereign Red
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 52,
  },
  locationTextSmall: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 4,
  },
  // labelText: {
  //   fontSize: 10,
  //   fontWeight: "800",
  //   color: "#334155"
  // },
});
