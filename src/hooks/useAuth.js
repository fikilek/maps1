import { authApi } from "../redux/authApi";

export const useAuth = () => {
  const { data, isLoading, isError } =
    authApi.endpoints.getAuthState.useQueryState();

  const role = data?.profile?.employment?.role || "GST";

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
