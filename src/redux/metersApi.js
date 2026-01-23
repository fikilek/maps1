import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const metersApi = createApi({
  reducerPath: "metersApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }), // Adjust to your Firebase/API config
  endpoints: (builder) => ({
    // Stream all meters for the LM to the Warehouse
    getMetersByLmPcode: builder.query({
      query: (lmPcode) => `meters?lmPcode=${lmPcode}`,
      // Transform to a searchable format if needed
      transformResponse: (response) => response || [],
    }),
    getMeterById: builder.query({
      query: (id) => `meters/${id}`,
    }),
  }),
});

export const { useGetMetersByLmPcodeQuery } = metersApi;
