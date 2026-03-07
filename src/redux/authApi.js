// src/redux/authApi.js

import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  PhoneAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../firebase";
import { clearAuthState } from "./authStorage";
// import { geoApi } from "./geoApi";

function tsToMs(ts) {
  if (!ts) return null;

  // Firestore Timestamp
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (typeof ts?.seconds === "number") return ts.seconds * 1000;

  // Already a number
  if (typeof ts === "number") return ts;

  // ISO string
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isFinite(ms) ? ms : null;
  }

  return null;
}

function normalizeUserProfile(raw) {
  if (!raw) return null;

  const meta = raw?.metadata || {};

  return {
    ...raw,
    // ✅ normalize metadata timestamps (keep original fields optional)
    metadata: {
      ...meta,
      createdAtMs: tsToMs(meta.createdAt),
      updatedAtMs: tsToMs(meta.updatedAt),
      // remove raw timestamps so nothing non-serializable enters Redux
      createdAt: undefined,
      updatedAt: undefined,
    },
  };
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Admin", "User"],
  endpoints: (builder) => ({
    /* =====================================================
       AUTH STATE (BOOTSTRAP + REALTIME LISTENERS)
       ===================================================== */
    getAuthState: builder.query({
      keepUnusedDataFor: Infinity,
      queryFn: () => ({
        data: {
          ready: false, // Start as not ready
          isAuthenticated: false,
          auth: null,
          profile: null,
          claims: null,
        },
      }),

      async onCacheEntryAdded(_, { updateCachedData, cacheEntryRemoved }) {
        let profileUnsubscribe = null;

        console.log(` `);
        console.log(`getAuthState ---onCacheEntryAdded started`);

        const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
          // 🛡️ Clean up old profile listener if user changes
          if (profileUnsubscribe) profileUnsubscribe();

          if (!user) {
            updateCachedData(() => ({
              ready: true,
              isAuthenticated: false,
              auth: null,
              profile: null,
              claims: null,
            }));
            return;
          }

          // 🛰️ 1. Start Profile Stream (Real-time)
          const userRef = doc(db, "users", user.uid);
          profileUnsubscribe = onSnapshot(userRef, async (snap) => {
            // 🛰️ 2. Load claims (needed for role-based logic)
            const tokenResult = await user.getIdTokenResult(true);

            updateCachedData((draft) => {
              draft.ready = true;
              draft.isAuthenticated = true;
              draft.auth = { uid: user.uid, email: user.email };
              const raw = snap.exists() ? snap.data() : null;
              draft.profile = raw ? normalizeUserProfile(raw) : null;

              // draft.profile = snap.exists() ? snap.data() : null;

              draft.claims = tokenResult.claims;
            });

            console.log(
              "📡 [AUTH STREAM]: Profile synchronized for",
              user.email,
            );
          });
        });

        await cacheEntryRemoved;
        authUnsubscribe();
        if (profileUnsubscribe) profileUnsubscribe();

        console.log(`getAuthState ---onCacheEntryAdded ended`);
      },
    }),

    // getAuthState: builder.query({
    //   // 🔒 NEVER remove this query from cache
    //   keepUnusedDataFor: Infinity,
    //   queryFn: () => ({
    //     data: {
    //       ready: true,
    //       isAuthenticated: false,
    //       auth: null,
    //       profile: null,
    //       claims: null,
    //     },
    //   }),

    //   async onCacheEntryAdded(_, { updateCachedData, cacheEntryRemoved }) {
    //     const unsubscribe = onAuthStateChanged(auth, async (user) => {
    //       // 🔐 AUTH STATE RESOLVED (no user)
    //       if (!user) {
    //         updateCachedData(() => ({
    //           ready: true,
    //           isAuthenticated: false,
    //           auth: null,
    //           profile: null,
    //           claims: null,
    //         }));
    //         return;
    //       }

    //       try {
    //         // Load user profile
    //         const userRef = doc(db, "users", user.uid);
    //         const snap = await getDoc(userRef);

    //         // Load claims
    //         const tokenResult = await user.getIdTokenResult(true);

    //         updateCachedData(() => ({
    //           ready: true,
    //           isAuthenticated: true,

    //           auth: {
    //             uid: user.uid,
    //             email: user.email,
    //           },

    //           profile: snap.exists() ? snap.data() : null,

    //           claims: tokenResult.claims,
    //         }));
    //       } catch (error) {
    //         // 🧯 Fail-safe: still mark auth as resolved
    //         updateCachedData(() => ({
    //           ready: true,
    //           isAuthenticated: true,
    //           auth: {
    //             uid: user.uid,
    //             email: user.email,
    //           },
    //           profile: null,
    //           claims: null,
    //         }));
    //       }
    //     });

    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),
    /* =====================================================
        SIGN UP GST (Locked to Guest Role)
      ===================================================== */

    signupGst: builder.mutation({
      async queryFn({ email, password, name, surname, serviceProvider, role }) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );
          const uid = cred.user.uid;

          await setDoc(doc(db, "users", uid), {
            uid,
            // 🛡️ Aligned to Schema v0.2 (Master Switch)
            accountStatus: "DISABLED",
            employment: {
              // 🛡️ Reflect the operative's selected role so Zamo can see it
              role: role || "GST",
              serviceProvider: {
                id: serviceProvider.id,
                name: serviceProvider.name,
              },
              level: role === "SPV" ? 4 : 2, // Default levels for SPV (4) and FWR (2)
            },
            access: {
              workbases: [],
              activeWorkbase: null,
            },
            onboarding: {
              // 🛑 Aligned to the Onboarding Matrix state
              status: "AWAITING-MNG-CONFIRMATION",
            },
            profile: {
              displayName: `${name} ${surname}`,
              email: email.toLowerCase().trim(),
              name: name.trim(),
              surname: surname.trim(),
            },
            metadata: {
              createdAt: serverTimestamp(),
              createdByUid: uid, // Self-created
              createdByUser: `${surname} ${name}`,
              updatedAt: serverTimestamp(),
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
          const signinResult = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );
          // console.log(`signin ----signinResult`, signinResult);

          return { data: true };
        } catch (error) {
          console.log(`signin ----signn error`);
          return { error };
        }
      },
    }),

    /* =====================================================
       SIGN OUT
       ===================================================== */

    signout: builder.mutation({
      async queryFn(_, { dispatch }) {
        try {
          await signOut(auth);

          // 🔥 CLEAR ALL FIRESTORE LISTENERS
          dispatch(authApi.util.resetApiState());
          // dispatch(geoApi.util.resetApiState());
          // add other APIs here (astsApi, erfsApi, etc.)

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
      async queryFn({ uid, update }) {
        // 🎯 Matches the component: { uid, update }
        try {
          const userRef = doc(db, "users", uid);

          // We use the values passed from the handleAuthorize function
          await updateDoc(userRef, update);

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    // updateProfile: builder.mutation({
    //   async queryFn({ uid, updates }) {
    //     try {
    //       const userRef = doc(db, "users", uid);

    //       await updateDoc(userRef, {
    //         ...updates,
    //         "metadata.updatedAt": serverTimestamp(),
    //         "metadata.updatedByUid": uid,
    //       });

    //       return { data: true };
    //     } catch (error) {
    //       return { error };
    //     }
    //   },

    //   // 🚀 THE RERENDER TRIGGER: Manually sync the local RAM cache
    //   async onQueryStarted({ uid, updates }, { dispatch, queryFulfilled }) {
    //     try {
    //       await queryFulfilled; // Wait for Firestore success

    //       dispatch(
    //         authApi.util.updateQueryData("getAuthState", undefined, (draft) => {
    //           // 🎯 Update the local profile object so useAuth() reacts immediately
    //           if (draft.profile && draft.auth?.uid === uid) {
    //             // Handle the "access.activeWorkbase" dot notation specifically
    //             if (updates["access.activeWorkbase"]) {
    //               draft.profile.access.activeWorkbase =
    //                 updates["access.activeWorkbase"];
    //             }

    //             // Handle other potential updates
    //             Object.entries(updates).forEach(([key, value]) => {
    //               if (key !== "access.activeWorkbase") {
    //                 draft.profile[key] = value;
    //               }
    //             });

    //             console.log(
    //               "🧠 [CACHE SYNC]: Local profile updated to",
    //               updates["access.activeWorkbase"]?.name,
    //             );
    //           }
    //         }),
    //       );
    //     } catch (err) {
    //       console.error("Cache Sync Failed:", err);
    //     }
    //   },
    // }),

    /* =====================================================
   SET / SWITCH ACTIVE WORKBASE
   ===================================================== */
    setActiveWorkbase: builder.mutation({
      async queryFn({ uid, workbase }) {
        try {
          const userRef = doc(db, "users", uid);

          // Read current onboarding status
          const snap = await getDoc(userRef);
          if (!snap.exists()) throw new Error("User not found");

          const user = snap.data();
          const updates = {
            "access.activeWorkbase": workbase,
            "metadata.updatedAt": serverTimestamp(),
            "metadata.updatedByUid": uid,
          };

          // 🔒 Only set onboarding COMPLETED if not already done
          if (user.onboarding?.status !== "COMPLETED") {
            updates["onboarding.status"] = "COMPLETED";
          }

          await updateDoc(userRef, updates);

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
          if (!auth.currentUser) {
            throw new Error("No authenticated user");
          }

          await sendEmailVerification(auth.currentUser);
          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       SYNC EMAIL VERIFIED
       ===================================================== */
    syncEmailVerified: builder.mutation({
      async queryFn({ uid }) {
        try {
          if (!auth.currentUser?.emailVerified) {
            // Email still not verified → nothing to sync
            return { data: false };
          }

          const userRef = doc(db, "users", uid);

          await updateDoc(userRef, {
            "onboarding.steps.emailVerified": true,
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
       REAUTHENTICATE
       ===================================================== */
    reauthenticate: builder.mutation({
      async queryFn({ password }) {
        try {
          const user = auth.currentUser;
          if (!user?.email) {
            throw new Error("No authenticated user");
          }

          const credential = EmailAuthProvider.credential(user.email, password);

          await reauthenticateWithCredential(user, credential);
          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       UPDATE EMAIL VERIFIED
       ===================================================== */
    updateEmailVerified: builder.mutation({
      async queryFn({ uid, email }) {
        await updateDoc(doc(db, "users", uid), {
          "identity.email": email,
          "onboarding.steps.emailVerified": true,
          "metadata.updatedAt": serverTimestamp(),
        });
        return { data: true };
      },
    }),

    /* =====================================================
       UPDATE EMAIL
       ===================================================== */
    updateEmail: builder.mutation({
      async queryFn({ newEmail }) {
        try {
          if (!auth.currentUser) {
            throw new Error("No authenticated user");
          }

          await updateEmail(auth.currentUser, newEmail);
          await sendEmailVerification(auth.currentUser);

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
      SEND PHONE OTP
      ===================================================== */
    sendPhoneOtp: builder.mutation({
      async queryFn({ phoneNumber, verifier }) {
        try {
          const provider = new PhoneAuthProvider(auth);
          const verificationId = await provider.verifyPhoneNumber(
            phoneNumber,
            verifier,
          );
          return { data: verificationId };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
      CONFIRM PHONE OTP
      ===================================================== */
    confirmPhoneOtp: builder.mutation({
      async queryFn({ verificationId, code, uid, phoneNumber }) {
        try {
          const credential = PhoneAuthProvider.credential(verificationId, code);

          // 🔑 Attach phone to existing user
          await linkWithCredential(auth.currentUser, credential);

          // 🔥 Update Firestore
          await updateDoc(doc(db, "users", uid), {
            "contact.phoneNumber": phoneNumber,
            "onboarding.steps.phoneVerified": true,
            "metadata.updatedAt": serverTimestamp(),
          });

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
   UPDATE PASSWORD
===================================================== */
    updatePassword: builder.mutation({
      async queryFn({ newPassword }) {
        try {
          if (!auth.currentUser) {
            throw new Error("No authenticated user");
          }

          await updatePassword(auth.currentUser, newPassword);
          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),

    /* =====================================================
       CREATE ADMIN (SPU ONLY)
       ===================================================== */
    createAdminUser: builder.mutation({
      async queryFn({ email, name, surname }) {
        try {
          const fn = httpsCallable(functions, "createAdminUser");

          const res = await fn({
            email,
            name,
            surname,
          });

          return { data: res.data };
        } catch (error) {
          console.log(`createAdminUser ----error`, error);
          return {
            error: {
              status: "CUSTOM_ERROR",
              message: error?.message || "Create admin failed",
            },
          };
        }
      },
      invalidatesTags: ["Admin", "User"],
    }),

    /* =====================================================
       INVITE MNG (SPU ONLY)
       ===================================================== */
    // src/redux/authApi.js
    inviteMng: builder.mutation({
      async queryFn({ email, name, surname, mnc, workbases }) {
        try {
          const fn = httpsCallable(functions, "inviteManagerUser");
          const res = await fn({
            email,
            name,
            surname,
            mnc, // Single object: { id: 'SP_RSTE_01', name: 'RSTE' }
            workbases, // Array of LMs: [{ id: 'ZA1048', name: 'Knysna LM' }, { id: 'WC048', name: 'Bitou' }]
          });

          return { data: res.data };
        } catch (error) {
          return { error: { message: error.message } };
        }
      },
      invalidatesTags: ["User"],
    }),

    /* =====================================================
        INVITE ADMIN (SPU ONLY)
       ===================================================== */
    inviteAdmin: builder.mutation({
      async queryFn({ email, name, surname }) {
        try {
          // 🎯 ALIGNMENT: Must match the deployed function name exactly
          const fn = httpsCallable(functions, "inviteAdminUser");

          const res = await fn({
            email,
            name,
            surname,
          });

          return { data: res.data };
        } catch (error) {
          console.error("❌ [AUTH API]: Admin Invite Failed", error);
          return {
            error: {
              status: "CUSTOM_ERROR",
              message: error?.message || "Admin appointment failed",
            },
          };
        }
      },
      // 🚀 THE FRESHNESS TRIGGER:
      // This tells Redux to refetch the users list so the new ADM appears immediately.
      invalidatesTags: ["User"],
    }),
  }),
});

/* =====================================================
   EXPORT HOOKS
   ===================================================== */
export const {
  useGetAuthStateQuery,
  useSignupGstMutation,
  useSigninMutation,
  useSignoutMutation,
  useUpdateProfileMutation,
  useSetActiveWorkbaseMutation,
  useSendEmailVerificationMutation,
  useReauthenticateMutation,
  useUpdateEmailVerifiedMutation,
  useSendPhoneOtpMutation,
  useConfirmPhoneOtpMutation,
  useUpdatePasswordMutation,
  useCreateAdminUserMutation,
  useInviteMngMutation,
  useInviteAdminMutation,
} = authApi;
