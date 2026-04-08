import { useAuth } from "@/src/hooks/useAuth";
import { useGetLmsByCountryQuery } from "@/src/redux/geoApi";
import {
  useCreateServiceProviderMutation,
  useGetServiceProvidersQuery,
} from "@/src/redux/spApi";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import FormServiceProvider from "./FormServiceProvider";
import {
  buildCreateServiceProviderPayload,
  createEmptyServiceProviderForm,
} from "./serviceProviderForm";

export default function FormCreateServiceProvider() {
  const router = useRouter();
  const { user, profile, role, isMNG } = useAuth();

  const creatorRoleCode = role || profile?.employment?.role || "NAv";

  const creatorServiceProvider = profile?.employment?.serviceProvider || null;

  const creatorServiceProviderId = creatorServiceProvider?.id || "NAv";

  const creatorServiceProviderName =
    creatorServiceProvider?.name ||
    creatorServiceProvider?.tradingName ||
    "NAv";

  const [createServiceProvider, { isLoading: isCreating }] =
    useCreateServiceProviderMutation();

  const { data: allLms = [], isLoading: isLoadingLms } =
    useGetLmsByCountryQuery("ZA");

  const {
    data: allServiceProviders = [],
    isLoading: isLoadingServiceProviders,
  } = useGetServiceProvidersQuery();

  const [formValues, setFormValues] = useState(
    createEmptyServiceProviderForm(),
  );

  const handleCreateServiceProvider = async () => {
    const createPayload = buildCreateServiceProviderPayload({
      formValues,
      creatorUid: user?.uid || "NAv",
      creatorName: profile?.profile?.displayName || "NAv",
      creatorRoleCode,
      creatorServiceProviderId,
      creatorServiceProviderName,
    });

    if (!createPayload.tradingName.trim()) {
      Alert.alert("Incomplete Form", "Trading Name is required.");
      return;
    }

    if (isMNG && creatorServiceProviderId === "NAv") {
      Alert.alert(
        "Missing Parent Service Provider",
        "This manager is not linked to a valid Service Provider.",
      );
      return;
    }

    try {
      await createServiceProvider(createPayload).unwrap();

      Alert.alert(
        "Service Provider Created",
        `${createPayload.tradingName} was created successfully.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert(
        "Creation Failed",
        "The Service Provider could not be created.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FormServiceProvider
          formValues={formValues}
          setFormValues={setFormValues}
          allLms={allLms}
          allServiceProviders={allServiceProviders}
          isLoadingLms={isLoadingLms}
          isLoadingServiceProviders={isLoadingServiceProviders}
          canEditClients={!isMNG}
          canEditStatus={false}
          showRegisteredName={false}
          showRegistrationNumber={false}
          showOwner={false}
          excludedServiceProviderId={null}
          submitLabel="CREATE SERVICE PROVIDER"
          helperNote={
            isMNG
              ? "As Manager, you are creating a Subcontractor under your current Service Provider."
              : "At this stage, only Trading Name and Client Allocation are captured. The rest of the Service Provider details can be completed later in Edit."
          }
          onSubmit={handleCreateServiceProvider}
          isSubmitting={isCreating}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 120,
  },
});
