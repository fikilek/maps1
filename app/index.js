// app/index.js
import { Redirect } from "expo-router";

export default function Index() {
  // This is just an entry point.
  // GuardedStack will immediately redirect correctly.
  return <Redirect href="/(auth)/signin" />;
}
