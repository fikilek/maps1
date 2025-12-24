import { Redirect } from "expo-router";
import { useGetAuthStateQuery } from "../src/redux/authApi";

export default function Index() {
  const { data: user, isLoading } = useGetAuthStateQuery();
  console.log(`Index (root) ---user`, user);

  if (isLoading) return null;
  console.log(`Index (root) ---Redirect to: "app"`);

  if (user?.isAuthenticated) {
    console.log(`Index (root) ---isLoading`, isLoading);
    return <Redirect href="/(app)" />;
  }

  console.log(`Index (root) ---Redirect to: "/(auth)/signin"`);
  return <Redirect href="/(auth)/signin" />;
}
