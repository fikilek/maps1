import uuid from "react-native-uuid";
import * as Yup from "yup";

export const spInitialValues = {
  profile: {
    name: "",
    classification: "MNC",
    registrationNumber: "",
  },

  ownership: {
    parentMncId: null,
  },

  workbases: {
    assigned: [],
  },

  offices: [
    {
      officeId: uuid.v4(),
      isHeadOffice: true,
      address: {
        line1: "",
        suburb: "",
        city: "",
        province: "",
        postalCode: "",
        country: "South Africa",
      },
      location: {
        lat: "",
        lng: "",
      },
      contacts: {
        email: "",
        phone: "",
        whatsapp: "",
      },
    },
  ],
};

export const spValidationSchema = Yup.object({
  profile: Yup.object({
    name: Yup.string().required("Service Provider name is required"),
    classification: Yup.string().oneOf(["MNC", "SUBC"]).required(),
    registrationNumber: Yup.string().nullable(),
  }),

  workbases: Yup.object({
    assigned: Yup.array().when("..profile.classification", {
      is: "MNC",
      then: (schema) =>
        schema.min(1, "At least one Local Municipality is required"),
      otherwise: (schema) => schema.max(0),
    }),
  }),

  offices: Yup.array()
    .of(
      Yup.object({
        address: Yup.object({
          line1: Yup.string().required("Address line 1 required"),
          city: Yup.string().required("City required"),
          province: Yup.string().required("Province required"),
          postalCode: Yup.string().required("Postal code required"),
        }),
        location: Yup.object({
          lat: Yup.number().required("Latitude required"),
          lng: Yup.number().required("Longitude required"),
        }),
      })
    )
    .min(1),
});
