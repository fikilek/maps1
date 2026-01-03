import { authApi } from "../redux/authApi";

/**
 * Custom hook to access the current authenticated user's
 * profile and status from the RTK Query cache.
 */
export const useAuth = () => {
  // Access the state of the getAuthState query
  const { data, isLoading, isError } =
    authApi.endpoints.getAuthState.useQueryState();

  return {
    user: data?.auth || null, // Firebase Auth object (uid, email)
    profile: data?.profile || null, // Firestore Document (role, onboarding status)
    role: data?.profile?.employment?.role || "GST",
    status: data?.profile?.onboarding?.status || "IDLE",
    workbases: data?.profile?.access?.workbases || [],
    isLoading,
    isError,
  };
};
