// src/redux/authApi.js

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  auth,
  db,
  doc,
  onAuthStateChanged,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "../firebase/index";
import { clearAuthState, loadAuthState, saveAuthState } from "./authStorage";

/*
  Auth cache shape (ALWAYS consistent):

  {
    auth: { uid, email } | null,
    profile: FirestoreUser | null,
    claims: {},
    isAuthenticated: boolean,
    ready: boolean
  }
*/

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),

  endpoints: (builder) => ({
    /* =====================================================
       AUTH STATE (BOOTSTRAP + REALTIME LISTENERS)
       ===================================================== */
    getAuthState: builder.query({
      queryFn: () => ({ data: null }),

      async onCacheEntryAdded(_, { updateCachedData, cacheEntryRemoved }) {
        let unsubscribeUserDoc = null;

        /* -------------------------------------------------
           1️⃣ HYDRATE FROM MMKV (FAST START)
           ------------------------------------------------- */
        const cached = loadAuthState();
        if (cached) {
          updateCachedData(() => ({
            ...cached,
            ready: false, // Firebase will confirm
          }));
        }

        /* -------------------------------------------------
           2️⃣ FIREBASE AUTH LISTENER
           ------------------------------------------------- */
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
          // 🔴 LOGGED OUT
          if (!user) {
            clearAuthState();

            if (unsubscribeUserDoc) {
              unsubscribeUserDoc();
              unsubscribeUserDoc = null;
            }

            updateCachedData(() => ({
              auth: null,
              profile: null,
              claims: {},
              isAuthenticated: false,
              ready: true,
            }));

            return;
          }

          // 🟢 LOGGED IN
          const userRef = doc(db, "users", user.uid);

          /* -------------------------------------------------
             3️⃣ FIRESTORE REALTIME LISTENER
             ------------------------------------------------- */
          unsubscribeUserDoc = onSnapshot(userRef, async (snap) => {
            try {
              const idTokenResult = await auth.currentUser.getIdTokenResult(
                false
              );

              const state = {
                auth: {
                  uid: user.uid,
                  email: user.email,
                },
                profile: snap.exists() ? snap.data() : null,
                claims: idTokenResult?.claims || {},
                isAuthenticated: true,
                ready: true,
              };

              // Persist minimal safe state
              saveAuthState(state);

              updateCachedData(() => state);
            } catch (error) {
              // Fail-safe: still authenticated
              updateCachedData(() => ({
                auth: {
                  uid: user.uid,
                  email: user.email,
                },
                profile: null,
                claims: {},
                isAuthenticated: true,
                ready: true,
              }));
            }
          });
        });

        /* -------------------------------------------------
           4️⃣ CLEANUP
           ------------------------------------------------- */
        await cacheEntryRemoved;
        unsubscribeAuth();
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      },
    }),

    /* =====================================================
       SIGN UP
       ===================================================== */
    signup: builder.mutation({
      async queryFn({ email, password, name, surname, phoneNumber }) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

          const uid = cred.user.uid;
          const userRef = doc(db, "users", uid);

          await setDoc(userRef, {
            uid,

            identity: {
              email,
              name,
              surname,
            },

            contact: {
              phoneNumber,
            },

            employment: {
              role: "gst",
              serviceProvider: null,
              companyName: null,
              supervisor: null,
            },

            access: {
              workbases: [],
              activeWorkbase: null,
            },

            onboarding: {
              status: "in_progress",
              steps: {
                signupCompleted: true,
                profileCompleted: true,
                serviceProviderAssigned: false,
                roleAssigned: false,
                workbasesAssigned: false,
                activeWorkbaseSelected: false,
                emailVerified: false,
                phoneVerified: false,
              },
              completedAt: null,
            },

            status: {
              isActive: true,
              isSuspended: false,
              suspendedReason: null,
            },

            metadata: {
              createdAt: serverTimestamp(),
              createdByUid: uid,
              updatedAt: serverTimestamp(),
              updatedByUid: uid,
            },
          });

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       SIGN IN
       ===================================================== */
    signin: builder.mutation({
      async queryFn({ email, password }) {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       SIGN OUT
       ===================================================== */
    signout: builder.mutation({
      async queryFn() {
        try {
          await signOut(auth);
          clearAuthState();
          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       UPDATE PROFILE (SAFE PARTIAL UPDATE)
       ===================================================== */
    updateProfile: builder.mutation({
      async queryFn({ uid, updates }) {
        try {
          const userRef = doc(db, "users", uid);

          await updateDoc(userRef, {
            ...updates,
            "metadata.updatedAt": serverTimestamp(),
            "metadata.updatedByUid": uid,
          });

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       SELECT ACTIVE WORKBASE
       ===================================================== */
    selectActiveWorkbase: builder.mutation({
      async queryFn({ uid, workbase }) {
        try {
          const userRef = doc(db, "users", uid);

          await updateDoc(userRef, {
            "access.activeWorkbase": workbase,
            "onboarding.steps.activeWorkbaseSelected": true,
            "metadata.updatedAt": serverTimestamp(),
            "metadata.updatedByUid": uid,
          });

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       EMAIL VERIFICATION
       ===================================================== */
    sendEmailVerification: builder.mutation({
      async queryFn() {
        try {
          if (!auth.currentUser) throw new Error("No authenticated user");
          await auth.currentUser.sendEmailVerification();
          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    syncEmailVerified: builder.mutation({
      async queryFn({ uid }) {
        try {
          if (!auth.currentUser?.emailVerified) {
            return { data: true };
          }

          const userRef = doc(db, "users", uid);

          await updateDoc(userRef, {
            "onboarding.steps.emailVerified": true,
          });

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),
  }),
});

/* =====================================================
   EXPORT HOOKS
   ===================================================== */
export const {
  useGetAuthStateQuery,
  useSignupMutation,
  useSigninMutation,
  useSignoutMutation,
  useUpdateProfileMutation,
  useSelectActiveWorkbaseMutation,
  useSendEmailVerificationMutation,
  useSyncEmailVerifiedMutation,
} = authApi;
