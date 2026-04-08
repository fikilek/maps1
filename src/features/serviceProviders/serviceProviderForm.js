export const createEmptyServiceProviderForm = () => ({
  profile: {
    registeredName: "",
    tradingName: "",
    registrationNumber: "",
  },

  owner: {
    id: "",
    name: "",
  },

  clients: [],
  offices: [],
  status: "ACTIVE",
});

export const normalizeServiceProviderForm = (formValues = {}) => {
  const profile = formValues?.profile || {};
  const owner = formValues?.owner || {};
  const clients = Array.isArray(formValues?.clients) ? formValues.clients : [];
  const offices = Array.isArray(formValues?.offices) ? formValues.offices : [];

  return {
    profile: {
      registeredName: profile?.registeredName?.trim() || "NAv",
      tradingName: profile?.tradingName?.trim() || "NAv",
      registrationNumber: profile?.registrationNumber?.trim() || "NAv",
    },

    owner: {
      id: String(owner?.id || "").trim() || "NAv",
      name: owner?.name?.trim() || "NAv",
    },

    clients: clients.map((client) => ({
      id: client?.id || "NAv",
      name: client?.name || "NAv",
      clientType: client?.clientType || "NAv",
      relationshipType: client?.relationshipType || "NAv",
    })),

    offices: offices.map((office, index) => ({
      id: office?.id || `OFF_${index + 1}`,
      officeType: office?.officeType || "LOCALOFFICE",

      address: {
        line1: office?.address?.line1?.trim() || "NAv",
        line2: office?.address?.line2?.trim() || "NAv",
        line3: office?.address?.line3?.trim() || "NAv",
      },

      officeContacts: {
        cellphone: office?.officeContacts?.cellphone?.trim() || "NAv",
        fixedline: office?.officeContacts?.fixedline?.trim() || "NAv",
        email: office?.officeContacts?.email?.trim() || "NAv",
      },

      contactPerson: {
        name: office?.contactPerson?.name?.trim() || "NAv",
        cellNumber: office?.contactPerson?.cellNumber?.trim() || "NAv",
        emailAdr: office?.contactPerson?.emailAdr?.trim() || "NAv",
      },

      status: office?.status || "ACTIVE",
    })),

    status: formValues?.status || "ACTIVE",
  };
};

export const buildCreateServiceProviderPayload = ({
  formValues,
  creatorUid,
  creatorName,
  creatorRoleCode,
  creatorServiceProviderId,
  creatorServiceProviderName,
}) => {
  const normalizedForm = normalizeServiceProviderForm(formValues);

  const isMNG = creatorRoleCode === "MNG";

  const subcClients = [
    {
      id: creatorServiceProviderId || "NAv",
      name: creatorServiceProviderName || "NAv",
      clientType: "SP",
      relationshipType: "SUBC",
    },
  ];

  return {
    tradingName: normalizedForm.profile.tradingName,
    clients: isMNG ? subcClients : normalizedForm.clients,
    formValues: {
      ...normalizedForm,
      clients: isMNG ? subcClients : normalizedForm.clients,
    },
    creatorUid: creatorUid || "NAv",
    creatorName: creatorName || "NAv",
    creatorRoleCode: creatorRoleCode || "NAv",
  };
};

export const buildUpdateServiceProviderPayload = ({
  id,
  formValues,
  updaterUid,
  updaterName,
  updaterRoleCode,
}) => {
  const normalizedForm = normalizeServiceProviderForm(formValues);

  return {
    id,
    patch: normalizedForm,
    updaterUid: updaterUid || "NAv",
    updaterName: updaterName || "NAv",
    updaterRoleCode: updaterRoleCode || "NAv",
  };
};
