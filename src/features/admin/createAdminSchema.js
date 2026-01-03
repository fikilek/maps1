import * as Yup from "yup";

export const createAdminSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),

  displayName: Yup.string()
    .min(2, "Too short")
    .required("Display name is required"),

  password: Yup.string()
    .min(8, "Minimum 8 characters")
    .required("Temporary password is required"),
});
