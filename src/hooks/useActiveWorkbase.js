// src/hooks/useActiveWorkbase.js
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";

export function useActiveWorkbase() {
  console.log(" ");
  console.log("useActiveWorkbase ----START START");
  console.log(" ");

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;
  // console.log("useActiveWorkbase ---authState", authState);

  const { ready, isAuthenticated } = authState ?? {};
  // console.log("useActiveWorkbase ---ready", ready);
  // console.log("useActiveWorkbase ---isAuthenticated", isAuthenticated);

  const { id } = authState?.profile?.access?.activeWorkbase ?? {};
  // console.log("useActiveWorkbase ---id", id);

  if (!ready) return null;
  if (!isAuthenticated) return null;

  return id ?? null;
}
