import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FieldArray, Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, Modal, Portal, Surface, Text } from "react-native-paper";
import { array, object, string } from "yup";

import { IrepsMedia } from "../../../components/media/IrepsMedia";
import { useWarehouse } from "../../context/WarehouseContext";
import { useAuth } from "../../hooks/useAuth";
import {
  addAccountDataQueueItem,
  getAccountDataDraftByPremiseId,
  removeAccountDataDraftByPremiseId,
  saveAccountDataDraft,
} from "../../utils/accountDataSubmissionQueue";
import { ForensicFooter } from "../meters/ForensicFooter";
import FormInputAccountNo from "./FormInputAccountNo";

const ACCOUNT_DATA_MEDIA_TAGS = [
  {
    tag: "accountDocumentPhoto",
    label: "Account Statement / Account Document",
    required: false,
  },
  {
    tag: "ownerIdPhoto",
    label: "Owner ID Photo",
    required: false,
  },
  {
    tag: "occupantIdPhoto",
    label: "Occupant ID Photo",
    required: false,
  },
  {
    tag: "proofOfResidencePhoto",
    label: "Proof of Residence",
    required: false,
  },
  {
    tag: "otherAccountEvidencePhoto",
    label: "Other Account Evidence",
    required: false,
  },
];

function readSingleParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

function toNAv(value) {
  const clean = String(value || "").trim();
  return clean || "NAv";
}

function normalizeAccountNo(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function formatPremiseAddress(premise) {
  return [
    premise?.address?.strNo,
    premise?.address?.strName,
    premise?.address?.strType,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function formatPropertyType(premise) {
  return [
    premise?.propertyType?.type,
    premise?.propertyType?.name,
    premise?.propertyType?.unitNo,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" • ");
}

function buildInitialValues() {
  return {
    owner: {
      ownerType: "NATURAL_PERSON",

      naturalPerson: {
        name: "",
        surname: "",
        idNumber: "",
      },

      juristicPerson: {
        registeredName: "",
        registrationNumber: "",
        tradingName: "",
      },

      contact: {
        phone: "",
        whatsapp: "",
        email: "",
      },
    },

    occupant: {
      isOwner: "no",
      name: "",
      surname: "",
      idNumber: "",
      relationshipToOwner: "",

      contact: {
        phone: "",
        whatsapp: "",
        email: "",
      },
    },

    accounts: [
      {
        accountNo: "",
      },
    ],

    media: [],
  };
}

function cleanOwner(owner = {}) {
  const ownerType =
    owner?.ownerType === "JURISTIC_PERSON" ? "JURISTIC_PERSON" : "NATURAL_PERSON";

  return {
    ownerType,

    naturalPerson: {
      name: toNAv(owner?.naturalPerson?.name),
      surname: toNAv(owner?.naturalPerson?.surname),
      idNumber: toNAv(owner?.naturalPerson?.idNumber),
    },

    juristicPerson: {
      registeredName: toNAv(owner?.juristicPerson?.registeredName),
      registrationNumber: toNAv(owner?.juristicPerson?.registrationNumber),
      tradingName: toNAv(owner?.juristicPerson?.tradingName),
    },

    contact: {
      phone: toNAv(owner?.contact?.phone),
      whatsapp: toNAv(owner?.contact?.whatsapp),
      email: toNAv(owner?.contact?.email),
    },
  };
}

function cleanOccupant(occupant = {}) {
  return {
    name: toNAv(occupant?.name),
    surname: toNAv(occupant?.surname),
    idNumber: toNAv(occupant?.idNumber),
    relationshipToOwner: toNAv(occupant?.relationshipToOwner),

    contact: {
      phone: toNAv(occupant?.contact?.phone),
      whatsapp: toNAv(occupant?.contact?.whatsapp),
      email: toNAv(occupant?.contact?.email),
    },
  };
}

function cleanAccounts(accounts = []) {
  const list = Array.isArray(accounts) ? accounts : [];

  return list
    .map((account) => ({
      accountNo: normalizeAccountNo(account?.accountNo),
    }))
    .filter((account) => !!account.accountNo);
}

function buildCleanPayload({ premiseId, values }) {
  return {
    premiseId,
    owner: cleanOwner(values?.owner),
    occupant: cleanOccupant(values?.occupant),
    accounts: cleanAccounts(values?.accounts),
    media: Array.isArray(values?.media) ? values.media : [],
  };
}

const AccountDataSchema = object().shape({
  owner: object().shape({
    ownerType: string()
      .oneOf(["NATURAL_PERSON", "JURISTIC_PERSON"])
      .required("Owner type is required"),

    naturalPerson: object().when("ownerType", {
      is: "NATURAL_PERSON",
      then: (schema) =>
        schema.shape({
          name: string().trim().required("Owner name is required"),
          surname: string().trim().required("Owner surname is required"),
          idNumber: string().nullable(),
        }),
      otherwise: (schema) => schema,
    }),

    juristicPerson: object().when("ownerType", {
      is: "JURISTIC_PERSON",
      then: (schema) =>
        schema.shape({
          registeredName: string().trim().required("Registered name is required"),
          registrationNumber: string().nullable(),
          tradingName: string().nullable(),
        }),
      otherwise: (schema) => schema,
    }),

    contact: object().shape({
      phone: string().nullable(),
      whatsapp: string().nullable(),
      email: string().email("Invalid email").nullable(),
    }),
  }),

  occupant: object().shape({
    isOwner: string().oneOf(["yes", "no"]).nullable(),
    contact: object().shape({
      email: string().email("Invalid email").nullable(),
    }),
  }),

  accounts: array()
    .of(
      object().shape({
        accountNo: string().trim().required("Account number is required"),
      }),
    )
    .min(1, "At least one account number is required")
    .test(
      "unique-account-numbers",
      "Duplicate account numbers are not allowed",
      (accounts = []) => {
        const normalized = accounts
          .map((account) => normalizeAccountNo(account?.accountNo))
          .filter(Boolean);

        return new Set(normalized).size === normalized.length;
      },
    ),

  media: array().of(object()).nullable(),
});

function SectionCard({ icon, title, children, tone = "default" }) {
  return (
    <Surface style={styles.sectionCard} elevation={1}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={tone === "warning" ? "#b45309" : "#0f172a"}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </Surface>
  );
}

function TextField({ label, value, onChangeText, keyboardType = "default" }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.textInputShell}>
        <TextInputProxy
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

function TextInputProxy({ value, onChangeText, keyboardType }) {
  return (
    <TextInput
      value={value || ""}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder="NAv"
      placeholderTextColor="#94a3b8"
      style={styles.textInput}
    />
  );
}

export default function FormAccountData() {
  const router = useRouter();
  const { premiseId: premiseIdRaw } = useLocalSearchParams();
  const premiseId = readSingleParam(premiseIdRaw);

  const { all } = useWarehouse();
  const { user, profile } = useAuth();

  const [draftValues, setDraftValues] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");

  const agentUid = user?.uid || "unknown_uid";
  const agentName = profile?.profile?.displayName || "Field Agent";

  const premise = useMemo(
    () => (all?.prems || []).find((item) => item?.id === premiseId) || null,
    [all?.prems, premiseId],
  );

  const premiseAddress = useMemo(() => formatPremiseAddress(premise), [premise]);
  const propertyType = useMemo(() => formatPropertyType(premise), [premise]);
  const accountRefs = Array.isArray(premise?.accountRefs) ? premise.accountRefs : [];
  const accountCount = accountRefs.length;
  const parents = premise?.parents || {};
  const fallbackGps = premise?.geometry?.centroid || null;

  const initialValues = useMemo(() => {
    return draftValues || buildInitialValues();
  }, [draftValues]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });

    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDraft = async () => {
      if (!premiseId) {
        if (mounted) setDraftLoaded(true);
        return;
      }

      const draft = await getAccountDataDraftByPremiseId(premiseId);

      if (mounted) {
        setDraftValues(draft?.values || null);
        setDraftLoaded(true);
      }
    };

    loadDraft();

    return () => {
      mounted = false;
    };
  }, [premiseId]);

  const context = useMemo(
    () => ({
      premiseId: premise?.id || premiseId || "NAv",
      erfId: premise?.erfId || "NAv",
      erfNo: premise?.erfNo || "NAv",
      lmPcode: parents?.lmPcode || "NAv",
      wardPcode: parents?.wardPcode || "NAv",
    }),
    [premise?.id, premise?.erfId, premise?.erfNo, premiseId, parents?.lmPcode, parents?.wardPcode],
  );

  const handleSaveDraft = async (values) => {
    if (!premiseId) {
      Alert.alert("Missing Premise", "Premise id is required to save this draft.");
      return;
    }

    setBusyMessage("Saving local draft...");

    const result = await saveAccountDataDraft({
      premiseId,
      values,
      context,
      savedByUid: agentUid,
      savedByUser: agentName,
    });

    setBusyMessage("");

    Alert.alert(
      result?.success ? "Draft Saved" : "Draft Save Failed",
      result?.message || "Draft operation completed.",
    );
  };

  const handleSubmitLocalQueue = async (values, actions) => {
    if (!premiseId) {
      Alert.alert("Missing Premise", "Premise id is required to submit this form.");
      actions?.setSubmitting?.(false);
      return;
    }

    if (!premise?.id) {
      Alert.alert(
        "Premise Unavailable",
        "This premise is not available in the current synced ward. Please sync or select the correct ward and try again.",
      );
      actions?.setSubmitting?.(false);
      return;
    }

    setBusyMessage("Saving to local account data queue...");

    const cleanPayload = buildCleanPayload({ premiseId, values });

    const result = await addAccountDataQueueItem({
      premiseId,
      payload: cleanPayload,
      context,
      createdByUid: agentUid,
      createdByUser: agentName,
    });

    if (result?.success) {
      await removeAccountDataDraftByPremiseId(premiseId);
      setShowSuccess(true);
    } else {
      Alert.alert(
        "Submit Failed",
        result?.message || "Failed to save account data to local queue.",
      );
    }

    setBusyMessage("");
    actions?.setSubmitting?.(false);
  };

  const copyOwnerToOccupant = ({ values, setFieldValue }) => {
    Alert.alert(
      "Copy Owner to Occupant?",
      "Owner details will populate the occupant fields. You can still edit the occupant fields after copying.",
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "COPY",
          onPress: () => {
            const owner = values?.owner || {};

            if (owner?.ownerType === "JURISTIC_PERSON") {
              setFieldValue("occupant.name", owner?.juristicPerson?.registeredName || "");
              setFieldValue("occupant.surname", "");
              setFieldValue("occupant.idNumber", owner?.juristicPerson?.registrationNumber || "");
              setFieldValue("occupant.relationshipToOwner", "JURISTIC_OWNER");
            } else {
              setFieldValue("occupant.name", owner?.naturalPerson?.name || "");
              setFieldValue("occupant.surname", owner?.naturalPerson?.surname || "");
              setFieldValue("occupant.idNumber", owner?.naturalPerson?.idNumber || "");
              setFieldValue("occupant.relationshipToOwner", "OWNER");
            }

            setFieldValue("occupant.contact.phone", owner?.contact?.phone || "");
            setFieldValue("occupant.contact.whatsapp", owner?.contact?.whatsapp || "");
            setFieldValue("occupant.contact.email", owner?.contact?.email || "");
            setFieldValue("occupant.isOwner", "yes");
          },
        },
      ],
    );
  };

  if (!draftLoaded) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Loading account form...</Text>
      </View>
    );
  }

  if (!premise) {
    return (
      <View style={styles.loaderWrap}>
        <MaterialCommunityIcons name="home-alert-outline" size={52} color="#f59e0b" />
        <Text style={styles.loaderText}>Premise not available in the current synced ward.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(tabs)/premises")}
        >
          <Text style={styles.backBtnText}>BACK TO PREMISES</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={AccountDataSchema}
        onSubmit={handleSubmitLocalQueue}
        enableReinitialize={true}
        validateOnMount={true}
        validateOnChange={true}
      >
        {({ values, setFieldValue, errors }) => (
          <View style={styles.screen}>
            <Stack.Screen
              options={{
                title: "FormAccountData",
                headerTitleStyle: { fontSize: 14, fontWeight: "900" },
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => router.replace("/(tabs)/premises")}
                    style={{ marginLeft: 10, padding: 5 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <View style={{ marginRight: 15 }}>
                    <Text style={styles.headerErfText}>{premise?.erfNo || "NAv"}</Text>
                  </View>
                ),
              }}
            />

            <ScrollView
              style={styles.container}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <SectionCard icon="home-city-outline" title="Premise Summary">
                <Text style={styles.summaryAddress}>{premiseAddress || "NAv"}</Text>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryLabel}>ERF</Text>
                    <Text style={styles.summaryValue}>{premise?.erfNo || "NAv"}</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryLabel}>Ward</Text>
                    <Text style={styles.summaryValue}>{parents?.wardPcode || "NAv"}</Text>
                  </View>
                  <View style={styles.summaryPillWide}>
                    <Text style={styles.summaryLabel}>Property</Text>
                    <Text style={styles.summaryValue}>{propertyType || "NAv"}</Text>
                  </View>
                </View>
              </SectionCard>

              <SectionCard icon="account-cash-outline" title="Existing Accounts">
                {accountCount > 0 ? (
                  <>
                    <Text style={styles.infoText}>
                      {accountCount} account{accountCount === 1 ? "" : "s"} linked to this premise.
                    </Text>
                    {!isOnline && (
                      <Text style={styles.warningText}>
                        Existing account details are unavailable offline. You can still capture new account data.
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.infoText}>No accounts currently linked to this premise.</Text>
                )}
                <Text style={styles.mutedText}>You can capture another account below.</Text>
              </SectionCard>

              <SectionCard icon="barcode-scan" title="Capture Account Numbers">
                <FieldArray name="accounts">
                  {({ push, remove }) => (
                    <View>
                      {(values?.accounts || []).map((account, index) => (
                        <Surface key={index} style={styles.accountRowCard} elevation={0}>
                          <View style={styles.accountRowHeader}>
                            <Text style={styles.accountRowTitle}>Account {index + 1}</Text>
                            {values.accounts.length > 1 && (
                              <TouchableOpacity
                                onPress={() => remove(index)}
                                style={styles.removeAccountBtn}
                              >
                                <MaterialCommunityIcons name="delete-outline" size={18} color="#dc2626" />
                                <Text style={styles.removeAccountText}>Remove</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          <FormInputAccountNo
                            label="Municipal Account Number"
                            name={`accounts.${index}.accountNo`}
                          />
                        </Surface>
                      ))}

                      {typeof errors?.accounts === "string" && (
                        <Text style={styles.formErrorText}>{errors.accounts}</Text>
                      )}

                      <TouchableOpacity
                        style={styles.addAccountBtn}
                        onPress={() => push({ accountNo: "" })}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#0f172a" />
                        <Text style={styles.addAccountText}>ADD ACCOUNT</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </FieldArray>
              </SectionCard>

              <SectionCard icon="account-tie-outline" title="Owner">
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      values.owner.ownerType === "NATURAL_PERSON" && styles.toggleBtnActive,
                    ]}
                    onPress={() => setFieldValue("owner.ownerType", "NATURAL_PERSON")}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        values.owner.ownerType === "NATURAL_PERSON" && styles.toggleBtnTextActive,
                      ]}
                    >
                      Natural Person
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      values.owner.ownerType === "JURISTIC_PERSON" && styles.toggleBtnActive,
                    ]}
                    onPress={() => setFieldValue("owner.ownerType", "JURISTIC_PERSON")}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        values.owner.ownerType === "JURISTIC_PERSON" && styles.toggleBtnTextActive,
                      ]}
                    >
                      Juristic Person
                    </Text>
                  </TouchableOpacity>
                </View>

                {values.owner.ownerType === "JURISTIC_PERSON" ? (
                  <>
                    <TextField
                      label="Registered Name"
                      value={values.owner.juristicPerson.registeredName}
                      onChangeText={(value) => setFieldValue("owner.juristicPerson.registeredName", value)}
                    />
                    <TextField
                      label="Registration Number"
                      value={values.owner.juristicPerson.registrationNumber}
                      onChangeText={(value) => setFieldValue("owner.juristicPerson.registrationNumber", value)}
                    />
                    <TextField
                      label="Trading Name"
                      value={values.owner.juristicPerson.tradingName}
                      onChangeText={(value) => setFieldValue("owner.juristicPerson.tradingName", value)}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Name"
                      value={values.owner.naturalPerson.name}
                      onChangeText={(value) => setFieldValue("owner.naturalPerson.name", value)}
                    />
                    <TextField
                      label="Surname"
                      value={values.owner.naturalPerson.surname}
                      onChangeText={(value) => setFieldValue("owner.naturalPerson.surname", value)}
                    />
                    <TextField
                      label="ID Number"
                      value={values.owner.naturalPerson.idNumber}
                      onChangeText={(value) => setFieldValue("owner.naturalPerson.idNumber", value)}
                    />
                  </>
                )}

                <Text style={styles.subSectionTitle}>Owner Contact</Text>
                <TextField
                  label="Phone"
                  value={values.owner.contact.phone}
                  onChangeText={(value) => setFieldValue("owner.contact.phone", value)}
                  keyboardType="phone-pad"
                />
                <TextField
                  label="WhatsApp"
                  value={values.owner.contact.whatsapp}
                  onChangeText={(value) => setFieldValue("owner.contact.whatsapp", value)}
                  keyboardType="phone-pad"
                />
                <TextField
                  label="Email"
                  value={values.owner.contact.email}
                  onChangeText={(value) => setFieldValue("owner.contact.email", value)}
                  keyboardType="email-address"
                />
              </SectionCard>

              <SectionCard icon="account-outline" title="Occupant">
                <View style={styles.ownerOccupantRow}>
                  <Text style={styles.ownerOccupantText}>Is the occupant the owner?</Text>
                  <View style={styles.yesNoRow}>
                    <TouchableOpacity
                      style={[
                        styles.yesNoBtn,
                        values.occupant.isOwner === "yes" && styles.yesBtnActive,
                      ]}
                      onPress={() => copyOwnerToOccupant({ values, setFieldValue })}
                    >
                      <Text
                        style={[
                          styles.yesNoText,
                          values.occupant.isOwner === "yes" && styles.yesNoTextActive,
                        ]}
                      >
                        YES
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.yesNoBtn,
                        values.occupant.isOwner === "no" && styles.noBtnActive,
                      ]}
                      onPress={() => setFieldValue("occupant.isOwner", "no")}
                    >
                      <Text
                        style={[
                          styles.yesNoText,
                          values.occupant.isOwner === "no" && styles.yesNoTextActive,
                        ]}
                      >
                        NO
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextField
                  label="Name"
                  value={values.occupant.name}
                  onChangeText={(value) => setFieldValue("occupant.name", value)}
                />
                <TextField
                  label="Surname"
                  value={values.occupant.surname}
                  onChangeText={(value) => setFieldValue("occupant.surname", value)}
                />
                <TextField
                  label="ID Number"
                  value={values.occupant.idNumber}
                  onChangeText={(value) => setFieldValue("occupant.idNumber", value)}
                />
                <TextField
                  label="Relationship to Owner"
                  value={values.occupant.relationshipToOwner}
                  onChangeText={(value) => setFieldValue("occupant.relationshipToOwner", value)}
                />

                <Text style={styles.subSectionTitle}>Occupant Contact</Text>
                <TextField
                  label="Phone"
                  value={values.occupant.contact.phone}
                  onChangeText={(value) => setFieldValue("occupant.contact.phone", value)}
                  keyboardType="phone-pad"
                />
                <TextField
                  label="WhatsApp"
                  value={values.occupant.contact.whatsapp}
                  onChangeText={(value) => setFieldValue("occupant.contact.whatsapp", value)}
                  keyboardType="phone-pad"
                />
                <TextField
                  label="Email"
                  value={values.occupant.contact.email}
                  onChangeText={(value) => setFieldValue("occupant.contact.email", value)}
                  keyboardType="email-address"
                />
              </SectionCard>

              <SectionCard icon="camera-iris" title="Optional Media Evidence">
                <Text style={styles.mutedText}>
                  Media is optional. Capture evidence only when available.
                </Text>
                {ACCOUNT_DATA_MEDIA_TAGS.map((item) => (
                  <View key={item.tag} style={styles.mediaItemWrap}>
                    <Text style={styles.mediaLabel}>{item.label}</Text>
                    <IrepsMedia
                      name="media"
                      tag={item.tag}
                      agentName={agentName}
                      agentUid={agentUid}
                      fallbackGps={fallbackGps}
                      required={false}
                    />
                  </View>
                ))}
              </SectionCard>

              <TouchableOpacity
                style={styles.saveDraftBtn}
                onPress={() => handleSaveDraft(values)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="content-save-outline" size={20} color="#0f172a" />
                <Text style={styles.saveDraftText}>SAVE DRAFT LOCALLY</Text>
              </TouchableOpacity>
            </ScrollView>

            <ForensicFooter isTrnLoading={!!busyMessage} />
          </View>
        )}
      </Formik>

      <Portal>
        <Modal visible={!!busyMessage} dismissable={false} contentContainerStyle={styles.busyModal}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.busyText}>{busyMessage}</Text>
        </Modal>

        <Modal visible={showSuccess} dismissable={false} contentContainerStyle={styles.successModal}>
          <View style={styles.successContent}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={50} color="#fff" />
            </View>
            <Text style={styles.successTitle}>SAVED LOCALLY</Text>
            <Text style={styles.successSub}>
              Account data was saved to the Data Cleansing local queue for testing.
            </Text>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                setShowSuccess(false);
                router.replace("/(tabs)/premises");
              }}
            >
              <Text style={styles.continueBtnText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1F5F9" },
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  contentContainer: { padding: 12, paddingBottom: 24 },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 24,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#64748b",
    textAlign: "center",
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { color: "#fff", fontWeight: "900" },
  headerErfText: { color: "#2563eb", fontSize: 14, fontWeight: "900" },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#E2E8F0",
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#0f172a" },
  sectionBody: { padding: 14 },
  summaryAddress: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryPill: {
    minWidth: 92,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
  },
  summaryPillWide: {
    flex: 1,
    minWidth: 150,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: { fontSize: 12, color: "#0f172a", fontWeight: "800", marginTop: 3 },
  infoText: { fontSize: 13, color: "#0f172a", fontWeight: "700", lineHeight: 19 },
  mutedText: { fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 18 },
  warningText: {
    fontSize: 12,
    color: "#b45309",
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    fontWeight: "700",
  },
  accountRowCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 10,
  },
  accountRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  accountRowTitle: { fontSize: 12, color: "#0f172a", fontWeight: "900" },
  removeAccountBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  removeAccountText: { color: "#dc2626", fontSize: 10, fontWeight: "900" },
  formErrorText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
  },
  addAccountBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addAccountText: { color: "#0f172a", fontWeight: "900", fontSize: 12 },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  toggleBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleBtnActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  toggleBtnText: { color: "#334155", fontSize: 12, fontWeight: "900" },
  toggleBtnTextActive: { color: "#fff" },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  textInputShell: {},
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  subSectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 11,
    color: "#0f172a",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ownerOccupantRow: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  ownerOccupantText: { color: "#0f172a", fontWeight: "900", marginBottom: 10 },
  yesNoRow: { flexDirection: "row", gap: 8 },
  yesNoBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  yesBtnActive: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  noBtnActive: { backgroundColor: "#0f172a", borderColor: "#0f172a" },
  yesNoText: { color: "#334155", fontSize: 12, fontWeight: "900" },
  yesNoTextActive: { color: "#fff" },
  mediaItemWrap: { marginTop: 12 },
  mediaLabel: { fontSize: 11, fontWeight: "900", color: "#334155", marginBottom: 4 },
  saveDraftBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  saveDraftText: { color: "#0f172a", fontSize: 13, fontWeight: "900" },
  busyModal: {
    backgroundColor: "white",
    padding: 24,
    margin: 40,
    borderRadius: 18,
    alignItems: "center",
  },
  busyText: { marginTop: 12, color: "#334155", fontWeight: "800", textAlign: "center" },
  successModal: {
    backgroundColor: "white",
    padding: 30,
    margin: 40,
    borderRadius: 20,
    alignItems: "center",
  },
  successContent: { alignItems: "center", width: "100%" },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
  },
  successSub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  continueBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});
