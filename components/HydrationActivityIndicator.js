import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Text, View } from "react-native";

/* ======================================================
   PROGRESS BAR (Satellite data stream effect)
====================================================== */
function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(1, value));

  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-260, 260],
  });

  return (
    <View
      style={{
        height: 10,
        width: 260,
        borderRadius: 999,
        backgroundColor: "#E2E8F0",
        overflow: "hidden",
        marginTop: 14,
      }}
    >
      {/* filled progress */}
      <View
        style={{
          height: "100%",
          width: `${pct * 100}%`,
          borderRadius: 999,
          backgroundColor: "#00BFFF",
        }}
      />

      {/* satellite data stream sweep */}
      <Animated.View
        style={{
          position: "absolute",
          height: "100%",
          width: 40,
          backgroundColor: "rgba(255,255,255,0.35)",
          transform: [{ translateX }],
        }}
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

export default function HydrationActivityIndicator({
  title = "HYDRATING SOVEREIGN VAULT...",
  subtitle,
  status = "syncing", // syncing | ready | error | idle
  loadedCount = 0,
  totalCount = null, // null until snapshot.size is known
  showOnceHint = true,
  errorText = null,
}) {
  const startRef = useRef(Date.now());
  const [now, setNow] = useState(Date.now());

  // NASA telemetry pulse
  const [pulse, setPulse] = useState(true);

  // classified boot dots (3-line vibe)
  const [bootDots, setBootDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setBootDots((d) => (d.length > 3 ? "" : d + ".")),
      400,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status !== "syncing") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [status]);

  const elapsedMs = now - startRef.current;

  const totalKnown = typeof totalCount === "number" && totalCount > 0;

  const progress = useMemo(() => {
    if (totalKnown) return loadedCount / totalCount;
    return status === "ready" ? 1 : 0.18; // unknown total -> keep bar alive
  }, [loadedCount, totalCount, status, totalKnown]);

  const patienceMsg =
    "First load can take a moment. After this, switching wards is instant.";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 18,
        backgroundColor: "white",
      }}
    >
      <ActivityIndicator size="large" color="#00BFFF" />

      <Text
        style={{
          marginTop: 16,
          fontWeight: "900",
          color: "#0F172A",
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        {title}
      </Text>

      {!!subtitle && (
        <Text style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
          {subtitle}
        </Text>
      )}

      <ProgressBar value={progress} />

      {/* ✅ TOTAL COUNT HANDLING */}
      <Text style={{ fontSize: 12, color: "#334155", marginTop: 10 }}>
        Loaded ERFs:{" "}
        <Text style={{ fontWeight: "800" }}>
          {loadedCount.toLocaleString()}
        </Text>
        {"  "}
        {totalKnown ? (
          <>
            /{" "}
            <Text style={{ fontWeight: "800" }}>
              {totalCount.toLocaleString()}
            </Text>
          </>
        ) : (
          <Text style={{ fontWeight: "800", color: "#64748B" }}>
            / Calculating total…
          </Text>
        )}
      </Text>

      <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
        Elapsed: {formatMs(elapsedMs)}
        {status === "syncing" ? " • Please keep the app open" : ""}
      </Text>

      {/* NASA telemetry */}
      <Text
        style={{
          fontSize: 10,
          marginTop: 10,
          color: status === "error" ? "#EF4444" : pulse ? "#22C55E" : "#64748B",
          fontFamily: "monospace",
          letterSpacing: 1,
        }}
      >
        SYSTEM STATUS:{" "}
        {status === "syncing"
          ? totalKnown
            ? "DATA LINK ACTIVE"
            : "ACQUIRING MANIFEST"
          : status === "ready"
            ? "STANDBY"
            : status === "error"
              ? "TRANSMISSION ERROR"
              : "IDLE"}
      </Text>

      {/* classified boot */}
      <Text
        style={{
          fontSize: 10,
          marginTop: 4,
          color: "#94A3B8",
          fontFamily: "monospace",
          letterSpacing: 1,
        }}
      >
        BOOT SEQUENCE{bootDots}
      </Text>

      {showOnceHint && (
        <Text
          style={{
            fontSize: 11,
            color: "#475569",
            marginTop: 12,
            textAlign: "center",
            paddingHorizontal: 10,
          }}
        >
          {patienceMsg}
        </Text>
      )}

      {status === "error" && !!errorText && (
        <Text
          style={{
            fontSize: 11,
            color: "#B91C1C",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          {errorText}
        </Text>
      )}
    </View>
  );
}
