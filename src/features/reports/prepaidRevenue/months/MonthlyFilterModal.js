// src/features/reports/prepaidRevenue/months/MonthlyFilterModal.js
// ✅ MONTHLY ONLY: single month RADIO picker
// ✅ Auto-apply on selection (no Apply button)

import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import {
  getDefaultLastNMonths,
  normalizeSelectedMonths,
  ymToLabel,
} from "./monthUtils";

export default function MonthlyFilterModal({
  visible,
  onClose,
  availableYms,
  value,
  onChange,
}) {
  const available = useMemo(() => availableYms || [], [availableYms]);

  // local draft so user can cancel
  const [draft, setDraft] = useState(Array.isArray(value) ? value : []);

  useEffect(() => {
    setDraft(Array.isArray(value) ? value : []);
  }, [value, visible]);

  // Default = latest available month
  const default1 = useMemo(() => {
    const arr = getDefaultLastNMonths(available, 1);
    return arr?.[0] || null;
  }, [available]);

  const selectedYm = draft?.[0] || null;

  const cancel = () => {
    setDraft(Array.isArray(value) ? value : []);
    onClose?.();
  };

  const resetDefault = () => {
    if (!default1) return;

    const clean = normalizeSelectedMonths([default1], available);
    onChange(clean); // ⭐ auto apply
    onClose?.();
  };

  // ⭐ AUTO-APPLY SELECTION
  const onPick = (ym) => {
    const clean = normalizeSelectedMonths([ym], available);
    onChange(clean); // notify parent
    onClose?.(); // close immediately
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancel}
    >
      {/* backdrop — CENTERED */}
      <Pressable
        onPress={cancel}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* sheet */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 14,
            width: "90%",
            maxWidth: 420,
            maxHeight: "80%",
          }}
        >
          {/* header */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}
              >
                Select Month
              </Text>
              <Text style={{ marginTop: 4, color: "#6B7280", fontSize: 12 }}>
                Pick 1 month • Available: {available.length} • Selected:{" "}
                {selectedYm ? 1 : 0}
              </Text>
            </View>

            <Pressable
              onPress={cancel}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: "#F3F4F6",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontWeight: "900", color: "#111827", fontSize: 12 }}
              >
                Close
              </Text>
            </Pressable>
          </View>

          {/* actions — ONLY Default now */}
          <View style={{ marginTop: 12 }}>
            <Pressable
              onPress={resetDefault}
              style={{
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontWeight: "900", color: "#111827", fontSize: 12 }}
              >
                Default (Latest)
              </Text>
            </Pressable>
          </View>

          {/* list */}
          <View style={{ marginTop: 14 }}>
            <Text
              style={{ fontWeight: "900", color: "#111827", marginBottom: 8 }}
            >
              Pick 1 month
            </Text>

            <ScrollView
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 14,
                backgroundColor: "#FFFFFF",
              }}
            >
              {available.map((ym) => {
                const active = selectedYm === ym;

                return (
                  <Pressable
                    key={`m-${ym}`}
                    onPress={() => onPick(ym)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    {/* radio */}
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: active ? "#111827" : "#9CA3AF",
                        marginRight: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {active ? (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            backgroundColor: "#111827",
                          }}
                        />
                      ) : null}
                    </View>

                    <Text
                      style={{
                        color: "#111827",
                        fontWeight: active ? "900" : "700",
                      }}
                    >
                      {ymToLabel(ym)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
