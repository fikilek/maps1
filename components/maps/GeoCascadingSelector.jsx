import { Picker } from "@react-native-picker/picker";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import {
  useGetLocalMunicipalityByIdQuery,
  useGetTownsQuery,
  useGetWardsQuery,
} from "../../src/redux/geoApi";

/**
 * GeoCascadingSelector (Maps Mode)
 *
 * Props:
 * - activeWorkbaseId (string)  // REQUIRED
 * - onChange (function)        // ({ lm, town, ward })
 * - disabled (boolean)
 */
const GeoCascadingSelector = ({
  activeWorkbaseId,
  onChange,
  disabled = false,
}) => {
  console.log(" ");
  console.log("GeoCascadingSelector ----START START");
  console.log(" ");

  console.log("GeoCascadingSelector ----activeWorkbaseId", activeWorkbaseId);

  /* =========================
  LOCKED LM (WORKBASE)
  ========================= */
  const { data: lm } = useGetLocalMunicipalityByIdQuery(activeWorkbaseId, {
    skip: !activeWorkbaseId,
  });
  console.log("GeoCascadingSelector ----lm", lm);

  /* =========================
     LOCAL SELECTION STATE
  ========================= */
  const [townId, setTownId] = useState(null);
  const [wardId, setWardId] = useState(null);

  /* =========================
     RTK QUERY DATA
  ========================= */
  const { data: towns = [] } = useGetTownsQuery(activeWorkbaseId, {
    skip: !activeWorkbaseId,
  });

  const { data: wards = [] } = useGetWardsQuery(townId, {
    skip: !townId,
  });

  /* =========================
     RESET LOGIC
  ========================= */

  // Change town → reset ward
  useEffect(() => {
    setWardId(null);
  }, [townId]);

  /* =========================
     DERIVED OBJECTS (STABLE)
  ========================= */
  const selectedTown = useMemo(
    () => towns.find((t) => t.id === townId) || null,
    [towns, townId]
  );

  const selectedWard = useMemo(
    () => wards.find((w) => w.id === wardId) || null,
    [wards, wardId]
  );

  /* =========================
     EMIT CHANGE (MAPS CONTRACT)
  ========================= */
  useEffect(() => {
    if (!lm) return;

    onChange?.({
      lm,
      town: selectedTown,
      ward: selectedWard,
    });
  }, [lm, selectedTown, selectedWard]);

  /* =========================
     PICKER RENDER HELPER
  ========================= */
  const renderPicker = (label, value, onChange, items, enabled = true) => (
    <View style={{ marginBottom: 12, opacity: enabled ? 1 : 0.5 }}>
      <Text style={{ marginBottom: 4 }}>{label}</Text>
      <Picker
        selectedValue={value}
        enabled={enabled && !disabled}
        onValueChange={onChange}
      >
        <Picker.Item label="Select…" value={null} />
        {items.map((item) => (
          <Picker.Item
            key={item.id}
            label={item.name || item.wardNumber}
            value={item.id}
          />
        ))}
      </Picker>
    </View>
  );

  /* =========================
     RENDER
  ========================= */
  if (!lm) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" style={{ paddingVertical: 20 }} />
      </View>
    );
  }

  return (
    <View style={{ padding: 12 }}>
      {/* LOCKED WORKBASE */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: "bold" }}>Workbase</Text>
        <Text>{lm.name}</Text>
      </View>

      {/* TOWN SELECT */}
      {renderPicker("Town", townId, setTownId, towns, towns.length > 0)}

      {/* WARD SELECT */}
      {townId &&
        renderPicker("Ward", wardId, setWardId, wards, wards.length > 0)}
    </View>
  );
};

export default GeoCascadingSelector;
