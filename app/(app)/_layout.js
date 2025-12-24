import { Slot } from "expo-router";

export default function AppLayout() {
  return <Slot />;
}

// import { Redirect, Stack } from "expo-router";
// import { useGetAuthStateQuery } from "../../src/redux/authApi";

// export default function AppLayout() {
//   const { data: user, isLoading } = useGetAuthStateQuery();

//   if (isLoading) return null;

//   if (!user?.isAuthenticated) {
//     return <Redirect href="/(auth)/signin" />;
//   }

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false,
//       }}
//     />
//   );
// }
