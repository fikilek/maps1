import { useAuth } from "@/src/hooks/useAuth";
import { Redirect } from "expo-router";

export default function AdminIndex() {
  const { role } = useAuth();

  if (role === "SPU") {
    return <Redirect href="/(tabs)/admin/(spu)/create-admin" />;
  }

  if (role === "ADM") {
    return <Redirect href="/(tabs)/admin/(adm)" />;
  }

  return null;
}
