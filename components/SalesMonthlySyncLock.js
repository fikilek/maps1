import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { Portal, Surface, Text } from "react-native-paper";

function ProgressBar({ value = null }) {
  const isKnown = typeof value === "number" && value >= 0;
  const pct = isKnown ? Math.max(0, Math.min(1, value)) : 0.18;

  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-320, 320],
  });

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      <Animated.View
        style={[
          styles.progressSweep,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

function formatMs(ms) {
  if (!ms || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function formatCount(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString() : "0";
}

export default function SalesMonthlySyncLock({
  visible = false,
  title = "SYNCING MONTHLY SALES",
  lmName = "LOCAL MUNICIPALITY",
  monthLabel = "Selected Month",
  phase = "Preparing prepaid monthly sales for fast local report access...",
  loadedCount = null,
  totalCount = null,
}) {
  const startRef = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [pulse, setPulse] = useState(true);
  const [bootDots, setBootDots] = useState("");

  useEffect(() => {
    if (!visible) return;
    startRef.current = Date.now();
    setNow(Date.now());
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setPulse((p) => !p), 700);
    return () => clearInterval(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(
      () => setBootDots((d) => (d.length >= 3 ? "" : d + ".")),
      400,
    );
    return () => clearInterval(t);
  }, [visible]);

  const elapsedMs = now - startRef.current;
  const totalKnown = typeof totalCount === "number" && totalCount >= 0;

  const progress = useMemo(() => {
    if (totalKnown && totalCount > 0 && typeof loadedCount === "number") {
      return loadedCount / totalCount;
    }

    if (totalKnown && totalCount === 0) {
      return 1;
    }

    return null;
  }, [loadedCount, totalCount, totalKnown]);

  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.mask}>
        <Surface style={styles.dialog} elevation={5}>
          <View style={styles.heroBlock}>
            <ActivityIndicator size="large" color="#00BFFF" />

            <Text style={styles.title}>{title}</Text>

            <Text style={styles.scopeText}>
              {lmName} • {monthLabel}
            </Text>

            <Text style={styles.phaseText}>{phase}</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                DO NOT CLOSE THE APP OR NAVIGATE AWAY UNTIL SYNCHRONIZATION
                COMPLETES
              </Text>
            </View>

            <ProgressBar value={progress} />

            <Text style={styles.countText}>
              Downloaded Rows:{" "}
              <Text style={styles.countStrong}>{formatCount(loadedCount)}</Text>
              {totalKnown ? (
                <>
                  {"  "}/{"  "}
                  <Text style={styles.countStrong}>
                    {formatCount(totalCount)}
                  </Text>
                </>
              ) : (
                <Text style={styles.countPending}> / Calculating total…</Text>
              )}
            </Text>

            <Text style={styles.elapsedText}>
              Elapsed: {formatMs(elapsedMs)} • Please keep the app open
            </Text>

            <Text
              style={[
                styles.systemText,
                { color: pulse ? "#22C55E" : "#64748B" },
              ]}
            >
              SYSTEM STATUS: SALES DATA LINK ACTIVE
            </Text>

            <Text style={styles.bootText}>BOOT SEQUENCE{bootDots}</Text>
          </View>

          <View style={styles.storyBlock}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                WHAT iREPS IS DOING RIGHT NOW
              </Text>
              <Text style={styles.cardBody}>
                Downloading and preparing the selected prepaid monthly sales
                dataset for fast local report access on this device.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>WHY THIS MATTERS</Text>
              <Text style={styles.cardBody}>
                Once this month is stored locally, prepaid revenue reports for
                the same month open much faster and avoid repeating the heavy
                first download on this device.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>OPERATIONAL BENEFIT</Text>
              <Text style={styles.cardBody}>
                Separating sync from viewing keeps the report screen focused on
                reporting, while this storage workflow handles the one-time
                monthly data preparation safely.
              </Text>
            </View>
          </View>
        </Surface>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  mask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },

  dialog: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 28,
  },

  heroBlock: {
    alignItems: "center",
  },

  title: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
  },

  scopeText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
  },

  phaseText: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
  },

  progressTrack: {
    height: 10,
    width: "100%",
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#00BFFF",
  },

  progressSweep: {
    position: "absolute",
    height: "100%",
    width: 44,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  countText: {
    fontSize: 12,
    color: "#334155",
    marginTop: 12,
    textAlign: "center",
  },

  countStrong: {
    fontWeight: "900",
    color: "#0F172A",
  },

  countPending: {
    fontWeight: "800",
    color: "#64748B",
  },

  elapsedText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "center",
  },

  systemText: {
    fontSize: 10,
    marginTop: 12,
    fontFamily: "monospace",
    letterSpacing: 1,
    textAlign: "center",
  },

  bootText: {
    fontSize: 10,
    marginTop: 4,
    color: "#94A3B8",
    fontFamily: "monospace",
    letterSpacing: 1,
    textAlign: "center",
  },

  storyBlock: {
    marginTop: 22,
  },

  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  cardBody: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
  },

  warningBox: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  warningText: {
    fontSize: 9,
    color: "#EF4444",
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
