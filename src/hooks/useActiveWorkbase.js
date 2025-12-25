// src/hooks/useActiveWorkbase.js
import { useGetAuthStateQuery } from "../redux/authApi";

export function useActiveWorkbase() {
  const { data } = useGetAuthStateQuery();

  if (!data?.ready) return null;
  if (!data.isAuthenticated) return null;

  return data.profile?.access?.activeWorkbase?.id ?? null;
}
