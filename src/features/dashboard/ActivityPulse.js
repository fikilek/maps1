import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export const ActivityPulse = ({ activities }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LIVE ACTIVITY PULSE</Text>

      {activities.length === 0 ? (
        <Text style={styles.emptyText}>Waiting for field updates...</Text>
      ) : (
        activities.map((item, index) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.iconColumn}>
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={item.type === "NO_ACCESS" ? "#ef4444" : "#4cd964"}
              />
              {index !== activities.length - 1 && <View style={styles.line} />}
            </View>

            <View style={styles.textColumn}>
              <View style={styles.row}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  { color: item.type === "NO_ACCESS" ? "#ef4444" : "#4cd964" },
                ]}
              >
                {item.type}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 20,
  },
  item: { flexDirection: "row", marginBottom: 15 },
  iconColumn: { alignItems: "center", marginRight: 15 },
  line: { width: 2, flex: 1, backgroundColor: "#f1f5f9", marginTop: 4 },
  textColumn: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  timeText: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  itemSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },
  statusBadge: {
    fontSize: 9,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    paddingVertical: 20,
    fontSize: 12,
  },
});
