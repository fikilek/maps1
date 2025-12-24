import { useGetAuthStateQuery } from "../redux/authApi";

export default function AuthBootstrap() {
  console.log(`AuthBootstrap ---- START`);

  useGetAuthStateQuery(undefined, {
    // 🔒 keep this query alive forever
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: false,
    refetchOnFocus: false,
  });

  return null;
}
