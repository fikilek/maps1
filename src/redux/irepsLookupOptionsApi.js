import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { httpsCallable } from "firebase/functions";

import { functions } from "../firebase";

const LOOKUP_OPTIONS_CALLABLE = "onIrepsSelectOptionsCallable";

async function callLookupOptions(payload) {
  try {
    const callable = httpsCallable(functions, LOOKUP_OPTIONS_CALLABLE);
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.log("callLookupOptions ---- ERROR", {
      payload,
      message: error?.message,
      code: error?.code,
      details: error?.details,
      stack: error?.stack,
      raw: error,
    });

    throw error;
  }
}

export const irepsLookupOptionsApi = createApi({
  reducerPath: "irepsLookupOptionsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["IrepsLookupOptions"],

  endpoints: (builder) => ({
    getIrepsLookupOptions: builder.query({
      async queryFn({ lookupKey }) {
        try {
          const data = await callLookupOptions({ lookupKey });

          return {
            data,
          };
        } catch (error) {
          console.log("getIrepsLookupOptions --error ", error);

          return {
            error: {
              message: error?.message || "Failed to load iREPS lookup options",
              code: error?.code,
              details: error?.details,
              stack: error?.stack,
            },
          };
        }
      },

      providesTags: (_result, _error, arg) => [
        {
          type: "IrepsLookupOptions",
          id: arg?.lookupKey,
        },
      ],
    }),
  }),
});

export const { useGetIrepsLookupOptionsQuery } = irepsLookupOptionsApi;
