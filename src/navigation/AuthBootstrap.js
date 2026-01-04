import { getAuth } from "firebase/auth";
import { useEffect } from "react";
import { useGetAuthStateQuery } from "../redux/authApi";

export default function AuthBootstrap() {
  console.log("AuthBootstrap ---- START");

  const { data, isSuccess } = useGetAuthStateQuery(undefined, {
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: false,
    refetchOnFocus: false,
  });

  useEffect(() => {
    if (!isSuccess) return;

    const user = getAuth().currentUser;
    if (!user) return;

    // 🔑 Force refresh once auth is stable
    user.getIdToken(true).catch(console.error);
  }, [isSuccess]);

  return null;
}
