import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export default function ConnectionStatusLine({
  isOnline = true,
  height = 3,
  style,
}) {
  const translateX = useRef(new Animated.Value(-120)).current;

  const colors = useMemo(() => {
    if (isOnline) {
      return {
        track: "rgba(34, 197, 94, 0.22)",
        wave: "#22c55e",
      };
    }

    return {
      track: "rgba(239, 68, 68, 0.22)",
      wave: "#ef4444",
    };
  }, [isOnline]);

  useEffect(() => {
    translateX.stopAnimation();
    translateX.setValue(-120);

    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: 520,
        duration: isOnline ? 2600 : 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    loop.start();

    return () => {
      loop.stop();
      translateX.stopAnimation();
    };
  }, [isOnline, translateX]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          height,
          backgroundColor: colors.track,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.wave,
          {
            height,
            backgroundColor: colors.wave,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "absolute",
    left: -16,
    right: -16,
    bottom: 0,
  },
  wave: {
    position: "absolute",
    left: 0,
    width: 120,
    borderRadius: 999,
  },
});
