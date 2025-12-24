// import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

// import {
//   collection,
//   deleteDoc,
//   doc,
//   getDoc,
//   onSnapshot,
//   orderBy,
//   query,
//   setDoc,
//   Timestamp,
//   where,
// } from "firebase/firestore";
// import { db } from "../firebase"; // Adjust the import path as necessary
// // import { astsApi } from "./astsSlice";
// // import { erfsApi } from "./erfsSlice";

// export const usersApi = createApi({
//   reducerPath: "usersApi",
//   tagTypes: ["users"],
//   baseQuery: fakeBaseQuery(),
//   refetchOnReconnect: true,
//   endpoints: (builder) => ({
//     getUsers: builder.query({
//       queryFn: () => {
//         return { data: [] };
//       }, // Initial data fetch is not needed with onCacheEntryAdded
//       keepUnusedDataFor: 3600,
//       providesTags: ["Users"],
//       async onCacheEntryAdded(
//         args,
//         { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
//       ) {
//         console.log(`getUsers ----onCacheEntryAdded arg`, args);
//         try {
//           // Wait for the initial cache data to be loaded
//           await cacheDataLoaded;
//           const q = query(
//             collection(db, "users"),
//             orderBy("metadata.updatedAtDatetime", "desc")
//             // limit(150)
//           );
//           // Set up the Firestore listener
//           const unsubscribe = onSnapshot(q, (snapshot) => {
//             snapshot.docChanges().forEach((change) => {
//               const user = { id: change.doc?.id, ...change.doc.data() };
//               // console.log(`snapshot user`, user);

//               // Use updateCachedData to update the store with each change
//               updateCachedData((draft) => {
//                 if (change.type === "added") {
//                   console.log(`getUsers ----user added`);
//                   draft.push(user);
//                 } else if (change.type === "modified") {
//                   const index = draft.findIndex(
//                     (item) => item?.id === user?.id
//                   );
//                   if (index !== -1) {
//                     console.log(`getUsers ----user modified`);
//                     draft[index] = user;
//                   }
//                 } else if (change.type === "removed") {
//                   const index = draft.findIndex(
//                     (item) => item?.id === user?.id
//                   );
//                   if (index !== -1) {
//                     console.log(`getUsers ----user removed`);
//                     draft.splice(index, 1);
//                   }
//                 }
//                 // sort the data in descending order by date
//                 draft.sort((a, b) => {
//                   // console.log(`a`, a);
//                   // Firebase Timestamps have a toMillis() method that returns milliseconds
//                   return (
//                     b.metadata.updatedAtDatetime.toMillis() -
//                     a.metadata.updatedAtDatetime.toMillis()
//                   );
//                 });
//               });
//             });
//           });

//           // Unsubscribe from the listener when the cache entry is removed
//           await cacheEntryRemoved;
//           unsubscribe();
//         } catch (error) {
//           console.error(
//             "getUsers ----Firestore users streaming failed:",
//             error
//           );
//         }
//       },
//     }),
//     getUsersByWorkbase: builder.query({
//       queryFn: (workbase) => {
//         console.log(`getUsersByWorkbase ----workbase`, workbase);
//         return { data: [] };
//       }, // Initial data fetch is not needed with onCacheEntryAdded
//       keepUnusedDataFor: 3600,
//       providesTags: ["Users"],
//       async onCacheEntryAdded(
//         workbase,
//         { cacheDataLoaded, cacheEntryRemoved, updateCachedData }
//       ) {
//         console.log(
//           `getUsersByWorkbase ----onCacheEntryAdded workbase`,
//           workbase
//         );
//         if (!workbase) return;
//         try {
//           // Wait for the initial cache data to be loaded
//           await cacheDataLoaded;
//           const q = query(
//             collection(db, "users"),
//             where("workbase", "==", workbase),
//             orderBy("metadata.updatedAtDatetime", "desc")
//             // limit(150)
//           );
//           // Set up the Firestore listener
//           const unsubscribe = onSnapshot(q, (snapshot) => {
//             snapshot.docChanges().forEach((change) => {
//               const user = { id: change.doc?.id, ...change.doc.data() };
//               console.log(`getUsersByWorkbase ----snapshot user`, user);

//               // Use updateCachedData to update the store with each change
//               updateCachedData((draft) => {
//                 if (change.type === "added") {
//                   console.log(`getUsersByWorkbase ----user added`);
//                   draft.push(user);
//                 } else if (change.type === "modified") {
//                   const index = draft.findIndex(
//                     (item) => item?.id === user?.id
//                   );
//                   if (index !== -1) {
//                     console.log(`getUsersByWorkbase ----user modified`);
//                     draft[index] = user;
//                   }
//                 } else if (change.type === "removed") {
//                   const index = draft.findIndex(
//                     (item) => item?.id === user?.id
//                   );
//                   if (index !== -1) {
//                     console.log(`getUsersByWorkbase ----user removed`);
//                     draft.splice(index, 1);
//                   }
//                 }
//                 // sort the data in descending order by date
//                 draft.sort((a, b) => {
//                   // console.log(`a`, a);
//                   // Firebase Timestamps have a toMillis() method that returns milliseconds
//                   return (
//                     b.metadata.updatedAtDatetime.toMillis() -
//                     a.metadata.updatedAtDatetime.toMillis()
//                   );
//                 });
//               });
//             });
//           });

//           // Unsubscribe from the listener when the cache entry is removed
//           await cacheEntryRemoved;
//           unsubscribe();
//         } catch (error) {
//           console.error("Firestore users streaming failed:", error);
//           return { error: error.message };
//         }
//       },
//     }),
//     getUserById: builder.query({
//       queryFn: async (id) => {
//         // console.log(`getUserById ----id`, id);

//         if (!id) {
//           // console.log(`getUserById ----No id - return`, id);
//           return { error: "getUserById error - no user id" };
//         }

//         try {
//           const docRef = doc(db, "users", id);
//           if (!docRef) {
//             console.log(`getUserById ----No docRef - return`, docRef);
//             return { error: "getUserById error - no docRef" };
//           }

//           const docSnap = await getDoc(docRef);

//           if (docSnap.exists()) {
//             return { data: { id: docSnap.id, ...docSnap.data() } };
//           } else {
//             console.log(
//               `getUserById ----Error geting user - No such document `
//             );
//             return { error: "No such document!" };
//           }
//         } catch (error) {
//           console.log(`getUserById ----Error geting user `, error);
//           return { error: error.message };
//         }
//       },
//       providesTags: ["users"],
//     }),
//     updateUser: builder.mutation({
//       queryFn: async ({ displayName, uid, id, userData }) => {
//         console.log(`updateUser ----displayName`, displayName);
//         console.log(`updateUser ----uid`, uid);
//         console.log(`updateUser ----id`, id);
//         console.log(`updateUser ----userData`, userData);

//         // get user name
//         try {
//           const userRef = doc(db, "users", id);
//           console.log(`updateUser ----userRef`, userRef);

//           await setDoc(
//             userRef,
//             {
//               ...userData,
//               metadata: {
//                 ...userData.metadata,
//                 updatedAtDatetime: Timestamp.now(),
//                 updatedByUser: displayName,
//                 updatedByUid: id,
//               },
//             },
//             { merge: true }
//           );
//           console.log(`updateUser  ----DONE`);
//           return { data: `User [${userData?.email}] updated successfully` };
//         } catch (error) {
//           console.log(
//             `updateUser ----User ${userData?.email} update error: ${error.message} `
//           );
//           return { error: `User update error: ${error.message} ` };
//         }
//       },
//       invalidatesTags: ["users"],
//       // async onQueryStarted(args, { dispatch, queryFulfilled }) {
//       //   // console.log(`args`, args);
//       //   // const { id, trnData } = args;
//       //   try {
//       //     const fulfilled = await queryFulfilled;
//       //     console.log(`fulfilled`, fulfilled);

//       //     const patchResultErfs = dispatch(
//       //       erfsApi.util.invalidateTags(["Erfs"])
//       //     );
//       //     console.log(`patchResultErfs`, patchResultErfs);

//       //     const patchResultAsts = dispatch(
//       //       astsApi.util.invalidateTags(["Asts"])
//       //     );
//       //     console.log(`patchResultAsts`, patchResultAsts);
//       //   } catch (error) {
//       //     console.log(`error`, error);
//       //   }
//       // },
//     }),
//     deleteUser: builder.mutation({
//       queryFn: async (id) => {
//         // Flag the user as deleted. Don't ever delete.
//         try {
//           await deleteDoc(doc(db, "users", id));
//           return { data: `User with id [${id}] deleted successfully` };
//         } catch (error) {
//           return { error: error.message };
//         }
//       },
//       invalidatesTags: ["users"],
//     }),
//   }),
// });
// // console.log(`usersApi`, usersApi);

// export const {
//   useGetUsersQuery,
//   useGetUsersByWorkbaseQuery,
//   useGetUserByIdQuery,
//   useUpdateUserMutation,
// } = usersApi;
// usersApi.js
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),

  endpoints: (builder) => ({
    getUsers: builder.query({
      queryFn: async () => {
        console.log(` `);
        console.log(` `);
        console.log(`getUsers ----START START`);
        console.log(`getUsers ----START START`);
        try {
          const q = query(
            collection(db, "users"),
            orderBy("metadata.updatedAtDatetime", "desc")
            // limit(10)
          );
          const querySnapshot = await getDocs(q);
          const usersList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log(`getUsers ----usersList`, usersList);

          // return { data: usersList };

          console.log(`getUsers ----END END`);
          console.log(`getUsers ----END END`);
          console.log(` `);
          return { data: usersList };
        } catch (error) {
          console.log(`getUsers ----error`, error);
          return { data: error };
        }
      },
    }),
  }),
});
export const { useGetUsersQuery } = usersApi;
