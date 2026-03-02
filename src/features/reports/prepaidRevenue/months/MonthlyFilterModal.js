// src/features/reports/prepaidRevenue/months/MonthlyFilterModal.js
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import {
  getDefaultLastNMonths,
  getThreeMonthBatchFromSelected,
  normalizeSelectedMonths,
  toggleMonthWithMax,
  ymToLabel,
} from "./monthUtils";

/**
 * Props:
 * - visible: boolean
 * - onClose: () => void
 * - availableYms: string[]  (desc or unsorted ok)
 * - value: string[] (selected yms)
 * - onChange: (nextSelectedYms: string[]) => void
 */
export default function MonthlyFilterModal({
  visible,
  onClose,
  availableYms,
  value,
  onChange,
}) {
  const maxMonths = 3;

  const available = useMemo(() => availableYms || [], [availableYms]);

  // local draft so user can cancel
  const [draft, setDraft] = useState(Array.isArray(value) ? value : []);

  useEffect(() => {
    setDraft(Array.isArray(value) ? value : []);
  }, [value, visible]);

  const default3 = useMemo(
    () => getDefaultLastNMonths(available, 3),
    [available],
  );

  const apply = () => {
    const clean = normalizeSelectedMonths(draft, available);
    onChange(clean);
    onClose?.();
  };

  const cancel = () => {
    setDraft(Array.isArray(value) ? value : []);
    onClose?.();
  };

  const resetDefault = () => {
    setDraft(default3);
  };

  const onToggleCheckbox = (ym) => {
    setDraft((prev) => toggleMonthWithMax(prev, ym, maxMonths));
  };

  const onPickBatch = (ym) => {
    const batch = getThreeMonthBatchFromSelected(available, ym);
    if (batch.length) setDraft(batch);
  };

  const selectedCount = draft.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={cancel}
    >
      {/* backdrop */}
      <Pressable
        onPress={cancel}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        {/* sheet */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 14,
            maxHeight: "85%",
          }}
        >
          {/* header */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}
              >
                Monthly Filter
              </Text>
              <Text style={{ marginTop: 4, color: "#6B7280", fontSize: 12 }}>
                Select up to {maxMonths} months • Available: {available.length}{" "}
                • Selected: {selectedCount}
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

          {/* actions */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={resetDefault}
              style={{
                flex: 1,
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
                Default (Last 3)
              </Text>
            </Pressable>

            <Pressable
              onPress={apply}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: "#111827",
              }}
            >
              <Text
                style={{ fontWeight: "900", color: "#FFFFFF", fontSize: 12 }}
              >
                Apply
              </Text>
            </Pressable>
          </View>

          {/* columns */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            {/* COL 1: checkboxes */}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontWeight: "900", color: "#111827", marginBottom: 8 }}
              >
                Pick up to 3 months
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
                  const checked = draft.includes(ym);
                  const disabled = !checked && draft.length >= maxMonths;

                  return (
                    <Pressable
                      key={`cb-${ym}`}
                      onPress={() => !disabled && onToggleCheckbox(ym)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6",
                        flexDirection: "row",
                        alignItems: "center",
                        opacity: disabled ? 0.4 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: checked ? "#111827" : "#9CA3AF",
                          backgroundColor: checked ? "#111827" : "#FFFFFF",
                          marginRight: 10,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {checked ? (
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontWeight: "900",
                              fontSize: 12,
                            }}
                          >
                            ✓
                          </Text>
                        ) : null}
                      </View>

                      <Text style={{ color: "#111827", fontWeight: "700" }}>
                        {ymToLabel(ym)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* COL 2: radio batches */}
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontWeight: "900", color: "#111827", marginBottom: 8 }}
              >
                3-month batches (tap one)
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
                  const batch = getThreeMonthBatchFromSelected(available, ym);
                  const active =
                    batch.length > 0 &&
                    batch.length === draft.length &&
                    batch.every((x) => draft.includes(x));

                  return (
                    <Pressable
                      key={`rb-${ym}`}
                      onPress={() => onPickBatch(ym)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
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

                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#111827", fontWeight: "800" }}>
                          {ymToLabel(ym)}
                        </Text>
                        <Text
                          style={{
                            marginTop: 2,
                            color: "#6B7280",
                            fontSize: 11,
                          }}
                        >
                          {batch.length === 3
                            ? `${ymToLabel(batch[2])} • ${ymToLabel(batch[1])} • ${ymToLabel(batch[0])}`
                            : "Not enough previous months for full batch"}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
