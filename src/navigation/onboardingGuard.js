export function getOnboardingRoute(profile) {
  if (!profile?.onboarding) return "/onboarding/start";

  const { steps } = profile.onboarding;

  if (!steps.signupCompleted) return "/auth/signup";
  if (!steps.profileCompleted) return "/onboarding/profile";
  if (!steps.serviceProviderAssigned) return "/onboarding/waiting-sp";
  if (!steps.workbasesAssigned) return "/onboarding/waiting-workbase";
  if (!steps.activeWorkbaseSelected) return "/onboarding/select-workbase";
  if (!steps.emailVerified) return "/onboarding/verify-email";
  if (!steps.phoneVerified) return "/onboarding/verify-phone";

  return null; // onboarding complete
}
