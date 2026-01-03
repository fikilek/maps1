import { authApi } from "../redux/authApi";

export const useAuth = () => {
  const { data, isLoading, isError } =
    authApi.endpoints.getAuthState.useQueryState();
  console.log(`useAuth ----data`, data);

  const role = data?.profile?.employment?.role || "GST";
  console.log(`useAuth ----role`, role);

  return {
    user: data?.auth || null,
    profile: data?.profile || null,

    role,
    isSPU: role === "SPU",
    isADM: role === "ADM",

    status: data?.profile?.onboarding?.status || "IDLE",
    workbases: data?.profile?.access?.workbases || [],

    isLoading,
    isError,
  };
};
