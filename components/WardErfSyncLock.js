import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { Portal, Surface, Text } from "react-native-paper";

/* ======================================================
   PROGRESS BAR
====================================================== */
function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(1, value));
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

/* ======================================================
   STORY CONTENT
====================================================== */
function SyncStoryContent({ lmStats, currentTip }) {
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>WHAT iREPS IS DOING RIGHT NOW</Text>
        <Text style={styles.cardBody}>
          Preparing the ward ERF pack for fast local access, cleaner field
          workflows, and stronger operational continuity across maps, premises,
          meters, and TRNs.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>WHAT IS WARD ERF PACK</Text>
        <Text style={styles.cardBody}>
          As a revenue enhancement tool for local government entities and
          utilities, iREPS organizes operational data around the LM + Ward
          structure. The ward ERF pack is a local collection of ERF records for
          the active ward, optimized for quick access and use in field
          operations.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>WHY THIS MATTERS</Text>
        <Text style={styles.cardBody}>
          After this preparation, returning to this ward becomes faster on this
          device. This improves field navigation, reduces repeated loading
          delays, and strengthens ward-based operational work.
        </Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>LM OPERATIONAL SNAPSHOT</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Wards</Text>
            <Text style={styles.statValue}>
              {lmStats?.wards == null ? "—" : formatCount(lmStats.wards)}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ERFs</Text>
            <Text style={styles.statValue}>
              {lmStats?.erfs == null ? "—" : formatCount(lmStats.erfs)}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Meters</Text>
            <Text style={styles.statValue}>
              {lmStats?.meters == null ? "—" : formatCount(lmStats.meters)}
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TRNs</Text>
            <Text style={styles.statValue}>
              {lmStats?.trns == null ? "—" : formatCount(lmStats.trns)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.cardTitle}>iREPS INSIGHT</Text>
        <Text style={styles.tipText}>{currentTip}</Text>
      </View>
    </View>
  );
}

export default function WardErfSyncLock({
  visible = false,
  title = "SYNCING WARD ERFs",
  lmName = "LOCAL MUNICIPALITY",
  wardName = "WARD",
  phase = "Preparing ward ERF pack for operational use...",
  loadedCount = 0,
  totalCount = null,
  lmStats = {
    wards: null,
    erfs: null,
    meters: null,
    trns: null,
  },
  tips = [
    "iREPS uses LM + Ward as the operational backbone for field work.",
    "Syncing ward ERFs improves speed when switching back to this ward later.",
    "Territorially complete records make downstream premise and meter flows stronger.",
    "Ward-level preparation helps map, premise, and workorder flows feel more responsive.",
  ],
}) {
  const startRef = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [pulse, setPulse] = useState(true);
  const [bootDots, setBootDots] = useState("");
  const [tipIndex, setTipIndex] = useState(0);

  const storyTranslateY = useRef(new Animated.Value(0)).current;
  const [storyHeight, setStoryHeight] = useState(0);

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

  useEffect(() => {
    if (!visible) return;
    if (!Array.isArray(tips) || tips.length <= 1) return;

    const t = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4500);

    return () => clearInterval(t);
  }, [visible, tips]);

  useEffect(() => {
    if (!visible) return;
    if (!storyHeight) return;

    storyTranslateY.setValue(0);

    const loop = Animated.loop(
      Animated.timing(storyTranslateY, {
        toValue: -storyHeight,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [visible, storyHeight, storyTranslateY]);

  const elapsedMs = now - startRef.current;

  const totalKnown = typeof totalCount === "number" && totalCount >= 0;

  const progress = useMemo(() => {
    if (totalKnown && totalCount > 0) {
      return loadedCount / totalCount;
    }

    if (totalKnown && totalCount === 0) {
      return 1;
    }

    return 0.16;
  }, [loadedCount, totalCount, totalKnown]);

  const currentTip =
    Array.isArray(tips) && tips.length > 0 ? tips[tipIndex] : "";

  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.mask}>
        <Surface style={styles.dialog} elevation={5}>
          <View style={styles.heroBlock}>
            <ActivityIndicator size="large" color="#00BFFF" />

            <Text style={styles.title}>{title}</Text>

            <Text style={styles.scopeText}>
              {lmName} • {wardName}
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
              Loaded ERFs:{" "}
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
              SYSTEM STATUS: OPERATIONAL DATA LINK ACTIVE
            </Text>

            <Text style={styles.bootText}>BOOT SEQUENCE{bootDots}</Text>
          </View>

          <View style={styles.storyViewport}>
            <Animated.View
              style={{
                transform: [{ translateY: storyTranslateY }],
              }}
            >
              <View
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (h && h !== storyHeight) setStoryHeight(h);
                }}
              >
                <SyncStoryContent lmStats={lmStats} currentTip={currentTip} />
              </View>

              <SyncStoryContent lmStats={lmStats} currentTip={currentTip} />
            </Animated.View>
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

  storyViewport: {
    marginTop: 16,
    height: 340,
    overflow: "hidden",
  },

  card: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statsCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  tipCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 88,
    justifyContent: "center",
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statBox: {
    width: "47%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },

  statValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  tipText: {
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
