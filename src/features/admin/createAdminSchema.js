import * as Yup from "yup";

export const createAdminSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),

  name: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .required("First name is required"),

  surname: Yup.string()
    .min(2, "Surname must be at least 2 characters")
    .required("Surname is required"),
});
