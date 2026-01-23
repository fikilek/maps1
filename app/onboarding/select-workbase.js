// app/onboarding/select-workbase.js
import { FlashList } from "@shopify/flash-list";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, List, Text, Title } from "react-native-paper";
import { authApi, useSetActiveWorkbaseMutation } from "../../src/redux/authApi";
import { geoMemory } from "../../src/redux/mmkv";

export default function SelectWorkbase() {
  const { data: authState } = authApi.endpoints.getAuthState.useQueryState();
  const [setActiveWorkbase, { isLoading }] = useSetActiveWorkbaseMutation();

  const handleSelect = async (workbase) => {
    // 1. Update MMKV immediately (Synchronous)
    geoMemory.setStep("lmId", workbase.id);

    // 2. Update Firestore
    await setActiveWorkbase({
      uid: authState.auth.uid,
      workbase: { id: workbase.id, name: workbase.name },
    });

    // AuthGate in RootLayout will see the status change and push to /(app)
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Select Your Workbase</Title>
      <Text style={styles.subtitle}>
        Your manager has assigned you to the following areas:
      </Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlashList
          data={authState?.profile?.access?.workbases || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              left={(props) => (
                <List.Icon {...props} icon="city-variant-outline" />
              )}
              onPress={() => handleSelect(item)}
              style={styles.listItem}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subtitle: { marginBottom: 20, color: "gray" },
  listItem: { borderBottomWidth: 0.5, borderBottomColor: "#eee" },
});

// // app/onboarding/select-workbase.js
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { ActivityIndicator, Pressable, Text, View } from "react-native";
// import { useSelector } from "react-redux";

// import { authApi } from "../../src/redux/authApi";

// export default function SelectWorkbase() {
//   const router = useRouter();
//   const [selected, setSelected] = useState(null);

//   const authState = useSelector(authApi.endpoints.getAuthState.select())?.data;

//   const workbases = authState?.profile?.access?.workbases ?? [];
//   const uid = authState?.auth?.uid;

//   const [selectActiveWorkbase, { isLoading }] =
//     authApi.useSetActiveWorkbaseMutation();

//   const handleContinue = async () => {
//     if (!selected) return;

//     await selectActiveWorkbase({
//       uid,
//       workbase: selected,
//     });
//   };

//   return (
//     <View style={{ flex: 1, padding: 24 }}>
//       <Text style={{ fontSize: 20, fontWeight: "600" }}>
//         Select your active workbase
//       </Text>

//       <Text
//         style={{
//           fontSize: 14,
//           color: "#666",
//           marginVertical: 12,
//           lineHeight: 20,
//         }}
//       >
//         You’ve been assigned to multiple workbases.
//         {"\n\n"}
//         Please choose the one you’ll be working from today.
//         {"\n"}
//         You can change this later.
//       </Text>

//       <View style={{ marginTop: 16 }}>
//         {workbases.map((wb) => {
//           const isSelected = selected === wb.id;

//           return (
//             <Pressable
//               key={wb.id}
//               onPress={() => setSelected(wb)}
//               style={{
//                 padding: 16,
//                 borderRadius: 8,
//                 borderWidth: 1,
//                 borderColor: isSelected ? "#000" : "#ddd",
//                 marginBottom: 12,
//               }}
//             >
//               <Text style={{ fontSize: 16, fontWeight: "500" }}>{wb.name}</Text>

//               {wb.location && (
//                 <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
//                   {wb.location}
//                 </Text>
//               )}
//             </Pressable>
//           );
//         })}
//       </View>

//       <View style={{ marginTop: "auto" }}>
//         <Pressable
//           disabled={!selected || isLoading}
//           onPress={handleContinue}
//           style={{
//             backgroundColor: !selected ? "#ccc" : "#000",
//             padding: 16,
//             borderRadius: 8,
//             alignItems: "center",
//           }}
//         >
//           {isLoading ? (
//             <ActivityIndicator color="white" />
//           ) : (
//             <Text style={{ color: "white", fontWeight: "600" }}>Continue</Text>
//           )}
//         </Pressable>
//       </View>
//     </View>
//   );
// }
