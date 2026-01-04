import * as Yup from "yup";

export const spInitialValues = {
  profile: {
    name: "",
  },

  workbases: {
    assigned: [], // MNC only
  },
};

export const spValidationSchema = Yup.object().shape({
  profile: Yup.object().shape({
    name: Yup.string().required("Service Provider name is required"),
  }),

  workbases: Yup.object().shape({
    assigned: Yup.array()
      .of(
        Yup.object().shape({
          id: Yup.string().required(),
          name: Yup.string().required(),
        })
      )
      .min(1, "At least one workbase is required"),
  }),
});

export const FAKE_LMS = [
  { id: "ZA1048", name: "Knysna Local Municipality" },
  { id: "ZA1021", name: "City of Johannesburg" },
  { id: "ZA2137", name: "Lesedi Local Municipality" },
  { id: "ZA2139", name: "Ephraim Mogale Local Municipality" },
  { id: "ZA2156", name: "Blouberg Local Municipality" },
];
