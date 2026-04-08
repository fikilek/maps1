import { useAuth } from "@/src/hooks/useAuth";
import { useGetLmsByCountryQuery } from "@/src/redux/geoApi";
import {
  useGetServiceProvidersQuery,
  useUpdateServiceProviderMutation,
} from "@/src/redux/spApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import FormServiceProvider from "./FormServiceProvider";
import {
  buildUpdateServiceProviderPayload,
  createEmptyServiceProviderForm,
} from "./serviceProviderForm";

export default function FormEditServiceProvider() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { user, profile, isSPU, isADM } = useAuth();

  const updaterRoleCode = isSPU
    ? "SPU"
    : isADM
      ? "ADM"
      : profile?.role?.code || "NAv";

  const canEditClients = isSPU || isADM;
  const canEditStatus = isSPU || isADM;

  const {
    data: allServiceProviders = [],
    isLoading: isLoadingServiceProviders,
  } = useGetServiceProvidersQuery();

  const { data: allLms = [], isLoading: isLoadingLms } =
    useGetLmsByCountryQuery("ZA");

  const [updateServiceProvider, { isLoading: isUpdating }] =
    useUpdateServiceProviderMutation();

  const [formValues, setFormValues] = useState(
    createEmptyServiceProviderForm(),
  );

  const currentServiceProvider = useMemo(() => {
    return allServiceProviders.find(
      (serviceProvider) => serviceProvider.id === id,
    );
  }, [allServiceProviders, id]);

  useEffect(() => {
    if (!currentServiceProvider) return;

    setFormValues({
      profile: {
        registeredName:
          currentServiceProvider?.profile?.registeredName === "NAv"
            ? ""
            : currentServiceProvider?.profile?.registeredName || "",
        tradingName:
          currentServiceProvider?.profile?.tradingName === "NAv"
            ? ""
            : currentServiceProvider?.profile?.tradingName || "",
        registrationNumber:
          currentServiceProvider?.profile?.registrationNumber === "NAv"
            ? ""
            : currentServiceProvider?.profile?.registrationNumber || "",
      },

      owner: {
        id:
          currentServiceProvider?.owner?.id === "NAv"
            ? ""
            : currentServiceProvider?.owner?.id || "",
        name:
          currentServiceProvider?.owner?.name === "NAv"
            ? ""
            : currentServiceProvider?.owner?.name || "",
      },

      clients: Array.isArray(currentServiceProvider?.clients)
        ? currentServiceProvider.clients
        : [],

      offices: Array.isArray(currentServiceProvider?.offices)
        ? currentServiceProvider.offices
        : [],

      status: currentServiceProvider?.status || "ACTIVE",
    });
  }, [currentServiceProvider]);

  const handleUpdateServiceProvider = async () => {
    const updatePayload = buildUpdateServiceProviderPayload({
      id,
      formValues,
      updaterUid: user?.uid || "NAv",
      updaterName: profile?.profile?.displayName || "NAv",
      updaterRoleCode,
    });
    console.log(`updatePayload`, updatePayload);

    if (!updatePayload?.patch?.profile?.tradingName?.trim()) {
      Alert.alert("Incomplete Form", "Trading Name is required.");
      return;
    }

    try {
      await updateServiceProvider(updatePayload).unwrap();

      Alert.alert(
        "Service Provider Updated",
        `${updatePayload.patch.profile.tradingName} was updated successfully.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error) {
      console.log(`Service Provider could not be updated --error`, error);
      Alert.alert("Update Failed", "Service Provider could not be updated.");
    }
  };

  if (!currentServiceProvider && isLoadingServiceProviders) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator animating={true} color="#2563eb" size="large" />
      </View>
    );
  }

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
          canEditClients={canEditClients}
          canEditStatus={canEditStatus}
          showRegisteredName={true}
          showRegistrationNumber={true}
          showOwner={true}
          excludedServiceProviderId={id}
          submitLabel="UPDATE SERVICE PROVIDER"
          onSubmit={handleUpdateServiceProvider}
          isSubmitting={isUpdating}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 140,
  },
});
