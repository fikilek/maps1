import { skipToken } from "@reduxjs/toolkit/query";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useGetSalesAtomicByMeterMonthQuery } from "../src/redux/salesApi";

function formatZarFromCents(cents) {
  const rands = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rands);
}

function formatDateTime(ms) {
  const n = Number(ms || 0);
  if (!n) return "-";
  return new Date(n).toLocaleString("en-ZA");
}

export default function AtomicPurchasesModal({
  visible,
  onClose,
  isOnline,
  lmPcode,
  ym,
  meterNo,
}) {
  const args =
    visible && isOnline && lmPcode && ym && meterNo
      ? { lmPcode, ym, meterNo, limit: 200 }
      : skipToken;

  const atomic = useGetSalesAtomicByMeterMonthQuery(args);

  const title = meterNo ? `Atomic Purchases • ${meterNo}` : "Atomic Purchases";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Root overlay */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Backdrop (separate layer) */}
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        {/* Dialog */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 14,
            width: "90%",
            maxWidth: 420,
            height: "75%",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontWeight: "900", fontSize: 14, color: "#111827" }}
              >
                {title}
              </Text>
              <Text style={{ marginTop: 3, color: "#6B7280", fontSize: 11 }}>
                Month: {ym || "-"} • LM: {lmPcode || "-"}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: "#F3F4F6",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#111827" }}>Close</Text>
            </Pressable>
          </View>

          {/* Body */}
          <View style={{ marginTop: 12, flex: 1 }}>
            {!isOnline ? (
              <View style={{ padding: 14 }}>
                <Text style={{ fontWeight: "900", color: "#111827" }}>
                  Online only
                </Text>
                <Text style={{ marginTop: 6, color: "#6B7280" }}>
                  Atomic purchases are loaded live from Firestore. Please
                  connect to the internet.
                </Text>
              </View>
            ) : atomic.isLoading ? (
              <View style={{ paddingTop: 24, alignItems: "center" }}>
                <ActivityIndicator />
                <Text style={{ marginTop: 10, color: "#6B7280" }}>
                  Loading atomic purchases…
                </Text>
              </View>
            ) : atomic.isError ? (
              <View style={{ padding: 14 }}>
                <Text style={{ fontWeight: "900", color: "#B91C1C" }}>
                  Failed to load atomic purchases
                </Text>
                <Text style={{ marginTop: 6, color: "#6B7280" }}>
                  {String(
                    atomic.error?.message || atomic.error || "Unknown error",
                  )}
                </Text>

                <Pressable
                  onPress={() => atomic.refetch?.()}
                  style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: "#111827",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={atomic.data || []}
                keyExtractor={(x) => String(x.id)}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={{ padding: 14 }}>
                    <Text style={{ color: "#6B7280" }}>
                      No atomic purchases found for this meter in this month.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const amountC = item.amountC ?? item.amountTotalC ?? 0;
                  const txAtMs = item.txAtMs ?? item.createdAtMs ?? 0;
                  const token =
                    item.token ?? item.tokenNo ?? item.vendToken ?? null;

                  return (
                    <View
                      style={{
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        borderRadius: 14,
                        marginTop: 10,
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            flex: 1,
                            fontWeight: "900",
                            color: "#111827",
                          }}
                        >
                          {formatZarFromCents(amountC)}
                        </Text>
                        <Text
                          style={{
                            color: "#6B7280",
                            fontSize: 11,
                            fontWeight: "800",
                          }}
                        >
                          {formatDateTime(txAtMs)}
                        </Text>
                      </View>

                      {token ? (
                        <Text
                          style={{
                            marginTop: 6,
                            color: "#111827",
                            fontSize: 12,
                          }}
                        >
                          Token:{" "}
                          <Text style={{ fontWeight: "900" }}>
                            {String(token)}
                          </Text>
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
