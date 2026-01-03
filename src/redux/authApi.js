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
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { clearAuthState } from "./authStorage";

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
      // 🔒 NEVER remove this query from cache
      keepUnusedDataFor: Infinity,
      queryFn: () => ({
        data: {
          ready: true,
          isAuthenticated: false,
          auth: null,
          profile: null,
          claims: null,
        },
      }),

      async onCacheEntryAdded(_, { updateCachedData, cacheEntryRemoved }) {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          // 🔐 AUTH STATE RESOLVED (no user)
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

          try {
            // Load user profile
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            // Load claims
            const tokenResult = await user.getIdTokenResult(true);

            updateCachedData(() => ({
              ready: true,
              isAuthenticated: true,

              auth: {
                uid: user.uid,
                email: user.email,
              },

              profile: snap.exists() ? snap.data() : null,

              claims: tokenResult.claims,
            }));
          } catch (error) {
            // 🧯 Fail-safe: still mark auth as resolved
            updateCachedData(() => ({
              ready: true,
              isAuthenticated: true,
              auth: {
                uid: user.uid,
                email: user.email,
              },
              profile: null,
              claims: null,
            }));
          }
        });

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    /* =====================================================
        SIGN UP GST
      ===================================================== */
    /* =====================================================
        SIGN UP GST (Refined for iREPS Logic)
      ===================================================== */
    /* =====================================================
        SIGN UP GST (Locked to Guest Role)
      ===================================================== */
    signupGst: builder.mutation({
      async queryFn({ email, password, name, surname, serviceProvider }) {
        try {
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const uid = cred.user.uid;

          await setDoc(doc(db, "users", uid), {
            uid,
            identity: { email, name, surname },
            employment: {
              // 🛡️ LOCKED: All public signups start as GST
              role: "GST",
              serviceProvider: {
                id: serviceProvider.id,
                name: serviceProvider.name,
              },
            },
            access: {
              workbases: [],
              activeWorkbase: null,
            },
            onboarding: {
              // 🛑 LOCKED: Must wait for manual confirmation
              status: "AWAITING_SP_CONFIRMATION",
              steps: {
                signupCompleted: true,
                spConfirmed: false,
                workbasesAssigned: false,
                activeWorkbaseSelected: false,
              },
            },
            metadata: {
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
          });

          return { data: true };
        } catch (error) {
          return { error };
        }
      },
    }),
    // signupGst: builder.mutation({
    //   async queryFn({ email, password, name, surname, serviceProvider }) {
    //     try {
    //       const cred = await createUserWithEmailAndPassword(
    //         auth,
    //         email,
    //         password
    //       );

    //       const uid = cred.user.uid;
    //       const userRef = doc(db, "users", uid);

    //       await setDoc(userRef, {
    //         uid,

    //         identity: {
    //           email,
    //           name,
    //           surname,
    //         },

    //         contact: {
    //           phoneNumber: null,
    //         },

    //         employment: {
    //           role: "GST",
    //           serviceProvider: {
    //             id: serviceProvider.id,
    //             name: serviceProvider.name,
    //           },
    //         },

    //         access: {
    //           workbases: [],
    //           activeWorkbase: null,
    //         },

    //         onboarding: {
    //           status: "AWAITING_SP_CONFIRMATION",
    //           completedAt: null,
    //           steps: {
    //             signupCompleted: true,
    //             spConfirmed: false,
    //             workbasesAssigned: false,
    //             activeWorkbaseSelected: false,
    //             emailVerified: false,
    //             phoneVerified: false,
    //           },
    //         },

    //         status: {
    //           isActive: true,
    //           isSuspended: false,
    //           suspendedReason: null,
    //         },

    //         metadata: {
    //           createdAt: serverTimestamp(),
    //           createdByUid: uid,
    //           updatedAt: serverTimestamp(),
    //           updatedByUid: uid,
    //         },
    //       });

    //       return { data: true };
    //     } catch (error) {
    //       return { error };
    //     }
    //   },
    // }),

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
       SET ACTIVE WORKBASE
       ===================================================== */
    setActiveWorkbase: builder.mutation({
      async queryFn({ uid, workbase }) {
        console.log(" ");
        console.log("selectActiveWorkbase ----START START");
        console.log(" ");

        console.log("selectActiveWorkbase ----uid", uid);
        console.log("selectActiveWorkbase ----workbase", workbase);
        try {
          const userRef = doc(db, "users", uid);

          await updateDoc(userRef, {
            "access.activeWorkbase": workbase,
            "onboarding.steps.activeWorkbaseSelected": true,
            "onboarding.status": "ACTIVE_WORKBASE_SELECTED",
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
            verifier
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
} = authApi;
