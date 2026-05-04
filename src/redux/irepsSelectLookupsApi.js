import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { httpsCallable } from "firebase/functions";

// Adjust this import to your mobile Firebase setup.
import { functions } from "../firebase";

const ADMIN_CALLABLE_NAME = "onIrepsSelectLookupAdminCallable";

async function callLookupAdmin(actionPayload) {
  const callable = httpsCallable(functions, ADMIN_CALLABLE_NAME);
  const result = await callable(actionPayload);
  return result.data;
}

export const irepsSelectLookupsApi = createApi({
  reducerPath: "irepsSelectLookupsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["IrepsSelectLookups", "IrepsSelectLookup"],

  endpoints: (builder) => ({
    listIrepsSelectLookups: builder.query({
      async queryFn() {
        try {
          const data = await callLookupAdmin({
            action: "LIST_LOOKUPS",
          });

          return {
            data: data?.lookups || [],
          };
        } catch (error) {
          console.log(`listIrepsSelectLookups --error `, error);
          return {
            error: {
              message: error?.message || "Failed to load iREPS select lookups",
              code: error?.code,
            },
          };
        }
      },
      providesTags: ["IrepsSelectLookups"],
    }),

    getIrepsSelectLookup: builder.query({
      async queryFn(lookupKey) {
        try {
          const data = await callLookupAdmin({
            action: "GET_LOOKUP",
            lookupKey,
          });

          return {
            data,
          };
        } catch (error) {
          console.log(`getIrepsSelectLookup --error `, error);
          return {
            error: {
              message: error?.message || "Failed to load iREPS select lookup",
              code: error?.code,
            },
          };
        }
      },
      providesTags: (_result, _error, lookupKey) => [
        { type: "IrepsSelectLookup", id: lookupKey },
      ],
    }),

    createIrepsSelectLookup: builder.mutation({
      async queryFn(lookup) {
        try {
          const data = await callLookupAdmin({
            action: "CREATE_LOOKUP",
            lookup,
          });

          return { data };
        } catch (error) {
          console.log(`createIrepsSelectLookup --error `, error);
          return {
            error: {
              message: error?.message || "Failed to create iREPS select lookup",
              code: error?.code,
            },
          };
        }
      },
      invalidatesTags: ["IrepsSelectLookups"],
    }),

    updateIrepsSelectLookup: builder.mutation({
      async queryFn({ lookupKey, patch }) {
        try {
          const data = await callLookupAdmin({
            action: "UPDATE_LOOKUP",
            lookupKey,
            patch,
          });

          return { data };
        } catch (error) {
          console.log(`updateIrepsSelectLookup --error `, error);
          return {
            error: {
              message: error?.message || "Failed to update iREPS select lookup",
              code: error?.code,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "IrepsSelectLookups",
        { type: "IrepsSelectLookup", id: arg.lookupKey },
      ],
    }),

    setIrepsSelectLookupStatus: builder.mutation({
      async queryFn({ lookupKey, action }) {
        try {
          const data = await callLookupAdmin({
            action,
            lookupKey,
          });

          return { data };
        } catch (error) {
          return {
            error: {
              message: error?.message || "Failed to change lookup status",
              code: error?.code,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "IrepsSelectLookups",
        { type: "IrepsSelectLookup", id: arg.lookupKey },
      ],
    }),

    createIrepsSelectOption: builder.mutation({
      async queryFn({ lookupKey, option }) {
        try {
          const data = await callLookupAdmin({
            action: "CREATE_OPTION",
            lookupKey,
            option,
          });

          return { data };
        } catch (error) {
          console.log(`createIrepsSelectOption --error `, error);
          return {
            error: {
              message: error?.message || "Failed to create iREPS select option",
              code: error?.code,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "IrepsSelectLookups",
        { type: "IrepsSelectLookup", id: arg.lookupKey },
      ],
    }),

    updateIrepsSelectOption: builder.mutation({
      async queryFn({ lookupKey, optionCode, patch }) {
        try {
          const data = await callLookupAdmin({
            action: "UPDATE_OPTION",
            lookupKey,
            optionCode,
            patch,
          });

          return { data };
        } catch (error) {
          console.log(`updateIrepsSelectOption --error `, error);
          return {
            error: {
              message: error?.message || "Failed to update iREPS select option",
              code: error?.code,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "IrepsSelectLookups",
        { type: "IrepsSelectLookup", id: arg.lookupKey },
      ],
    }),

    setIrepsSelectOptionStatus: builder.mutation({
      async queryFn({ lookupKey, optionCode, action }) {
        try {
          const data = await callLookupAdmin({
            action,
            lookupKey,
            optionCode,
          });

          return { data };
        } catch (error) {
          console.log(`setIrepsSelectOptionStatus --error `, error);
          return {
            error: {
              message: error?.message || "Failed to change option status",
              code: error?.code,
            },
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        "IrepsSelectLookups",
        { type: "IrepsSelectLookup", id: arg.lookupKey },
      ],
    }),
  }),
});

export const {
  useListIrepsSelectLookupsQuery,
  useGetIrepsSelectLookupQuery,
  useCreateIrepsSelectLookupMutation,
  useUpdateIrepsSelectLookupMutation,
  useSetIrepsSelectLookupStatusMutation,
  useCreateIrepsSelectOptionMutation,
  useUpdateIrepsSelectOptionMutation,
  useSetIrepsSelectOptionStatusMutation,
} = irepsSelectLookupsApi;
