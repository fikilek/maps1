// src/redux/teamsApi.js

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

export const teamsApi = createApi({
  reducerPath: "teamsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Team"],
  endpoints: (builder) => ({
    /* =====================================================
       STREAM: GET TEAMS
       ===================================================== */
    getTeams: builder.query({
      async queryFn() {
        return { data: [] };
      },

      async onCacheEntryAdded(
        _,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;

          const q = query(collection(db, "teams"));

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData(() => {
              const nextTeams = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              return nextTeams;
            });
          });
        } catch (error) {
          console.error("❌ [TEAMS STREAM ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },

      // providesTags: ["Team"],
    }),

    /* =====================================================
       MUTATION: CREATE TEAM
       ===================================================== */
    createTeam: builder.mutation({
      async queryFn({ name, description = "NAv" }) {
        try {
          const callable = httpsCallable(functions, "createTeam");

          const result = await callable({
            name: String(name || "").trim(),
            description: String(description || "").trim() || "NAv",
          });

          return {
            data: result?.data || {
              success: true,
              message: "Team created successfully.",
            },
          };
        } catch (error) {
          console.log("createTeam ERROR", error);

          return {
            error: {
              message: error?.message || "Team creation failed in teamsApi.",
              code: error?.code || "unknown",
            },
          };
        }
      },
      // invalidatesTags: ["Team"],
    }),

    /* =====================================================
       MUTATION: RENAME TEAM
       ===================================================== */
    renameTeam: builder.mutation({
      async queryFn({ teamId, name }) {
        try {
          const callable = httpsCallable(functions, "renameTeam");

          const result = await callable({
            teamId: String(teamId || "").trim(),
            name: String(name || "").trim(),
          });

          return {
            data: result?.data || {
              success: true,
              message: "Team renamed successfully.",
              teamId,
            },
          };
        } catch (error) {
          console.log("renameTeam ERROR", error);

          return {
            error: {
              message: error?.message || "Team rename failed in teamsApi.",
              code: error?.code || "unknown",
            },
          };
        }
      },
      // invalidatesTags: ["Team"],
    }),

    /* =====================================================
       MUTATION: ADD TEAM MEMBER
       ===================================================== */
    addTeamMember: builder.mutation({
      async queryFn({ teamId, userUid }) {
        try {
          const callable = httpsCallable(functions, "addTeamMember");

          const result = await callable({
            teamId: String(teamId || "").trim(),
            userUid: String(userUid || "").trim(),
          });

          return {
            data: result?.data || {
              success: true,
              message: "Member added successfully.",
              teamId,
              userUid,
            },
          };
        } catch (error) {
          console.log("addTeamMember ERROR", error);

          return {
            error: {
              message: error?.message || "Add team member failed in teamsApi.",
              code: error?.code || "unknown",
            },
          };
        }
      },
      // invalidatesTags: ["Team"],
    }),

    /* =====================================================
       MUTATION: REMOVE TEAM MEMBER
       ===================================================== */
    removeTeamMember: builder.mutation({
      async queryFn({ teamId, userUid }) {
        try {
          const callable = httpsCallable(functions, "removeTeamMember");

          const result = await callable({
            teamId: String(teamId || "").trim(),
            userUid: String(userUid || "").trim(),
          });

          return {
            data: result?.data || {
              success: true,
              message: "Member removed successfully.",
              teamId,
              userUid,
            },
          };
        } catch (error) {
          console.log("removeTeamMember ERROR", error);

          return {
            error: {
              message:
                error?.message || "Remove team member failed in teamsApi.",
              code: error?.code || "unknown",
            },
          };
        }
      },
      invalidatesTags: ["Team"],
    }),

    /* =====================================================
       MUTATION: DELETE TEAM
       ===================================================== */
    deleteTeam: builder.mutation({
      async queryFn({ teamId }) {
        try {
          const callable = httpsCallable(functions, "deleteTeam");

          const result = await callable({
            teamId: String(teamId || "").trim(),
          });

          return {
            data: result?.data || {
              success: true,
              message: "Team deleted successfully.",
              teamId,
            },
          };
        } catch (error) {
          console.log("deleteTeam ERROR", error);

          return {
            error: {
              message: error?.message || "Delete team failed in teamsApi.",
              code: error?.code || "unknown",
            },
          };
        }
      },
      // invalidatesTags: ["Team"],
    }),
  }),
});

/* =====================================================
   EXPORT HOOKS
   ===================================================== */
export const {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useRenameTeamMutation,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useDeleteTeamMutation,
} = teamsApi;
