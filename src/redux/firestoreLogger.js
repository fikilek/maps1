export const fsLog = (scope, message, payload) => {
  if (__DEV__) {
    console.log(
      `%c[FS → RTK] ${scope}`,
      "color:#4CAF50;font-weight:bold;",
      message,
      payload ?? ""
    );
  }
};

export const fsWarn = (scope, message, payload) => {
  if (__DEV__) {
    console.warn(
      `%c[FS → RTK] ${scope}`,
      "color:#FF9800;font-weight:bold;",
      message,
      payload ?? ""
    );
  }
};

export const fsError = (scope, message, payload) => {
  if (__DEV__) {
    console.error(
      `%c[FS → RTK] ${scope}`,
      "color:#F44336;font-weight:bold;",
      message,
      payload ?? ""
    );
  }
};
