import { object, ref, string } from "yup";

export const userNewFormData = {
  surname: "kentane",
  name: "fikile",
  email: "fikile@gmail.com",
  password: "fkpass123",
  confirmPassword: "fkpass123",
  phoneNumber: "0812345678",
};

export const userValidationSchema = object().shape({
  surname: string().trim().required("Surname is required"),

  name: string().trim().required("Name is required"),

  email: string().email("Invalid email address").required("Email is required"),

  password: string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),

  confirmPassword: string()
    .oneOf([ref("password")], "Passwords do not match")
    .required("Confirm your password"),

  phoneNumber: string().trim().required("Phone number is required"),
});
