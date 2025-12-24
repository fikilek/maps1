import { useGetAuthStateQuery } from "./authApi";

export default function AuthBootstrap() {
  // This component exists ONLY to keep the subscription alive
  useGetAuthStateQuery();

  return null;
}
