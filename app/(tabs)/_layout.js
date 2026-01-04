import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../src/hooks/useAuth";

export default function TabsLayout() {
  const { profile } = useAuth();

  const titles = {
    maps: "Maps",
    erfs: "ERFs",
    trns: "Transactions",
    asts: "Assets",
    dashboard: "Dashboard",
    admin: "Admin",
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => (
          <AppHeader title={titles[route.name]} user={{ profile }} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="maps"
        options={{
          title: "Maps",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="erfs"
        options={{
          title: "ERFs",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-radius-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="trns"
        options={{
          title: "TRNs",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="swap-horizontal"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="asts"
        options={{
          title: "ASTs",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="counter" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="shield-account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

// import { Tabs } from "expo-router";

// export default function TabsLayout() {
//   return (
//     <Tabs>
//       <Tabs.Screen name="maps" />
//       <Tabs.Screen name="erfs" />
//       <Tabs.Screen name="trns" />
//       <Tabs.Screen name="asts" />
//       <Tabs.Screen name="dashboard" />
//       <Tabs.Screen name="admin" />
//       <Tabs.Screen
//         name="index"
//         options={{
//           href: null, // 👈 hides it completely
//         }}
//       />
//     </Tabs>
//   );
// }
