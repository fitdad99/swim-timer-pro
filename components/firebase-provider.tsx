"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  type Firestore,
  enableIndexedDbPersistence,
  setDoc,
} from "firebase/firestore"
import { getAuth, createUserWithEmailAndPassword, type Auth, initializeAuth, signOut, inMemoryPersistence } from "firebase/auth"
import { getStorage, ref, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage"

// Create context with proper typing
interface FirebaseContextType {
  app: FirebaseApp | null
  db: Firestore | null
  auth: Auth | null
  storage: FirebaseStorage | null
  initialized: boolean
  error: string | null
  getSwimmers: () => Promise<any[]>
  addSwimmer: (swimmer: any) => Promise<any>
  updateSwimmer: (id: string, data: any) => Promise<boolean>
  deleteSwimmer: (id: string) => Promise<boolean>
  getClubSettings: () => Promise<any>
  updateClubSettings: (settings: any) => Promise<boolean>
  uploadLogo: (file: File) => Promise<string | null>
  subscribeToSwimmers: (callback: (swimmers: any[]) => void) => () => void
  getUsers: () => Promise<any[]>
  addUser: (userData: any) => Promise<any>
  updateUser: (userId: string, userData: any) => Promise<boolean>
  deleteUser: (userId: string) => Promise<boolean>
  sendUserCredentials: (credentials: any) => Promise<boolean>
}

const FirebaseContext = createContext<FirebaseContextType | null>(null)

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null)
  const [db, setDb] = useState<Firestore | null>(null)
  const [auth, setAuth] = useState<Auth | null>(null)
  const [storage, setStorage] = useState<FirebaseStorage | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Firebase when component mounts
  useEffect(() => {
    try {
      // Check if Firebase is already initialized
      if (getApps().length === 0) {
        // Verify environment variables exist
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

        if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
          throw new Error("Firebase environment variables are missing")
        }

        // Initialize Firebase with environment variables
        const firebaseConfig = {
          apiKey,
          authDomain,
          projectId,
          storageBucket,
          messagingSenderId,
          appId,
          measurementId: measurementId || undefined,
        }

        console.log("Initializing Firebase with config:", {
          projectId: firebaseConfig.projectId,
          authDomain: firebaseConfig.authDomain,
        })

        const firebaseApp = initializeApp(firebaseConfig)
        const firestore = getFirestore(firebaseApp)
        const firebaseAuth = getAuth(firebaseApp)
        const firebaseStorage = getStorage(firebaseApp)

        // Initialize Firestore with error handling
        try {
          // Enable offline persistence (helps with connection issues)
          enableIndexedDbPersistence(firestore).catch((err: { code: string }) => {
            if (err.code === "failed-precondition") {
              console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.")
            } else if (err.code === "unimplemented") {
              console.warn("The current browser does not support all of the features required to enable persistence")
            } else {
              console.error("Error enabling persistence:", err)
            }
          })
        } catch (firestoreError) {
          console.error("Error configuring Firestore:", firestoreError)
        }

        setApp(firebaseApp)
        setDb(firestore)
        setAuth(firebaseAuth)
        setStorage(firebaseStorage)
        setInitialized(true)
        console.log("Firebase initialized successfully")
      } else {
        // Firebase already initialized
        const firebaseApp = getApps()[0]
        setApp(firebaseApp)
        setDb(getFirestore(firebaseApp))
        setAuth(getAuth(firebaseApp))
        setStorage(getStorage(firebaseApp))
        setInitialized(true)
        console.log("Using existing Firebase instance")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown Firebase initialization error"
      console.error("Firebase initialization error:", errorMessage, err)
      setError(errorMessage)
      setInitialized(false)
    }
  }, [])

  // Swimmer data functions with improved error handling
  const getSwimmers = async () => {
    if (!db) return []

    try {
      const swimmersCol = collection(db, "swimmers")
      const snapshot = await getDocs(swimmersCol)
      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting swimmers:", error)
      // Return empty array instead of throwing to prevent UI crashes
      return []
    }
  }

  const addSwimmer = async (swimmer: any) => {
    if (!db) return null

    try {
      // Create a sanitized version of the swimmer object
      const sanitizedSwimmer = {
        name: swimmer.name || "",
        times: Array.isArray(swimmer.times) ? swimmer.times : [],
        bestLapTimes: swimmer.bestLapTimes || {},
        createdAt: new Date().toISOString(),
      }

      const swimmersCol = collection(db, "swimmers")
      const docRef = await addDoc(swimmersCol, sanitizedSwimmer)
      return { id: docRef.id, ...sanitizedSwimmer }
    } catch (error) {
      console.error("Error adding swimmer:", error)
      return null
    }
  }

  const updateSwimmer = async (id: string, data: any) => {
    if (!db) return false

    try {
      // Ensure times array is properly formatted
      if (data.times) {
        data.times = data.times.map((time: any) => ({
          ...time,
          // Ensure date is a string if it's not already
          date: time.date instanceof Date ? time.date.toISOString() : time.date,
        }))
      }

      const swimmerRef = doc(db, "swimmers", id)
      await updateDoc(swimmerRef, data)
      return true
    } catch (error) {
      console.error("Error updating swimmer:", error)
      return false
    }
  }

  const deleteSwimmer = async (id: string) => {
    if (!db) return false

    try {
      const swimmerRef = doc(db, "swimmers", id)
      await deleteDoc(swimmerRef)
      return true
    } catch (error) {
      console.error("Error deleting swimmer:", error)
      return false
    }
  }

  // Club settings functions
  const getClubSettings = async () => {
    if (!db) return { name: "Swim Club", logoUrl: null }

    try {
      const settingsCol = collection(db, "settings")
      const q = query(settingsCol, where("type", "==", "club"))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        // Create default settings if none exist
        const defaultSettings = { name: "Swim Club", logoUrl: null, type: "club" }
        try {
          await addDoc(settingsCol, defaultSettings)
        } catch (err) {
          console.warn("Could not create default settings:", err)
        }
        return defaultSettings
      }

      return snapshot.docs[0].data()
    } catch (error) {
      console.error("Error getting club settings:", error)
      return { name: "Swim Club", logoUrl: null }
    }
  }

  const updateClubSettings = async (settings: any) => {
    if (!db) return false

    try {
      const settingsCol = collection(db, "settings")
      const q = query(settingsCol, where("type", "==", "club"))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        await addDoc(settingsCol, { ...settings, type: "club" })
      } else {
        const settingRef = doc(db, "settings", snapshot.docs[0].id)
        await updateDoc(settingRef, settings)
      }

      return true
    } catch (error) {
      console.error("Error updating club settings:", error)
      return false
    }
  }

  // File upload function
  const uploadLogo = async (file: File) => {
    if (!storage) return null

    try {
      // Create a unique filename to prevent collisions
      const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const storageRef = ref(storage, `logos/${uniqueFileName}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      return url
    } catch (error) {
      console.error("Error uploading logo:", error)
      return null
    }
  }

  // Real-time listeners with improved error handling
  const subscribeToSwimmers = (callback: (swimmers: any[]) => void) => {
    if (!db) {
      console.warn("Firebase not initialized, cannot subscribe to swimmers")
      return () => {}
    }

    try {
      const swimmersCol = collection(db, "swimmers")

      // Use a more robust onSnapshot implementation with error handling
      const unsubscribe = onSnapshot(
        swimmersCol,
        (snapshot: any) => {
          try {
            const swimmers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
            callback(swimmers)
          } catch (parseError) {
            console.error("Error parsing swimmer data:", parseError)
            callback([]) // Return empty array to prevent UI crashes
          }
        },
        (error: any) => {
          console.error("Firestore subscription error:", error)
          // Don't call callback here to avoid UI errors
        },
      )

      return unsubscribe
    } catch (error) {
      console.error("Error setting up swimmer subscription:", error)
      return () => {}
    }
  }

  // User management functions
  const getUsers = async () => {
    if (!db) return []

    try {
      // In a real application, you would use Firebase Admin SDK or a server function
      // For this demo, we'll use a collection to store user data
      const usersCol = collection(db, "users")
      const snapshot = await getDocs(usersCol)
      return snapshot.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error getting users:", error)
      return []
    }
  }

  const addUser = async (userData: any) => {
    if (!db || !auth || !app) return null

    try {
      // In a real application, you would use Firebase Admin SDK
      // For this demo, we'll use a more robust approach that works with Next.js
      let tempAuth: Auth;
      
      try {
        // Try to initialize with in-memory persistence first
        tempAuth = initializeAuth(app, {
          persistence: inMemoryPersistence
        });
      } catch (error) {
        console.warn("Could not initialize auth with in-memory persistence, falling back to default:", error);
        // Fallback to default auth if initializeAuth fails
        tempAuth = getAuth(app);
      }
    
      // Use the auth instance to create the user
      const userCredential = await createUserWithEmailAndPassword(tempAuth, userData.email, userData.password)
      
      // Get the user ID from the credential
      const userId = userCredential.user.uid;
      
      try {
        // Try to sign out from temp auth to clean up
        await signOut(tempAuth);
      } catch (signOutError) {
        console.warn("Error signing out from temporary auth:", signOutError);
        // Continue even if sign out fails
      }

      // Store additional user data in Firestore
      const userDoc = doc(db, "users", userId);
      await setDoc(userDoc, {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName || "",
        isAdmin: userData.isAdmin || false,
        createdAt: new Date().toISOString(),
      })

      return {
        uid: userId,
        email: userData.email,
        displayName: userData.displayName,
        isAdmin: userData.isAdmin,
      }
    } catch (error) {
      console.error("Error adding user:", error)
      throw error
    }
  }

  const deleteUser = async (userId: string) => {
    if (!db) return false

    try {
      // In a real application, you would use Firebase Admin SDK
      // For this demo, we'll just delete the user data from Firestore
      const usersCol = collection(db, "users")
      const q = query(usersCol, where("uid", "==", userId))
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref)
      }

      return true
    } catch (error) {
      console.error("Error deleting user:", error)
      return false
    }
  }

  const sendUserCredentials = async (credentials: any) => {
    if (!db) return false

    try {
      // In a real application, you would use a server function to send emails
      // For this demo, we'll just log the credentials and simulate success
      console.log("Sending credentials to:", credentials.email, {
        name: credentials.name,
        password: credentials.password,
      })

      // Store a record of the email being sent
      const emailsCol = collection(db, "emails")
      await addDoc(emailsCol, {
        to: credentials.email,
        subject: "Your Swimmer Timing System Credentials",
        sentAt: new Date().toISOString(),
        // Don't store the actual password in the database
        passwordSent: true,
      })

      return true
    } catch (error) {
      console.error("Error sending credentials:", error)
      return false
    }
  }

  // User management - Add this function after deleteUser
  const updateUser = async (userId: string, userData: any) => {
    if (!db) return false;

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, userData);
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  };

  const value: FirebaseContextType = {
    app,
    db,
    auth,
    storage,
    initialized,
    error,
    getSwimmers,
    addSwimmer,
    updateSwimmer,
    deleteSwimmer,
    getClubSettings,
    updateClubSettings,
    uploadLogo,
    subscribeToSwimmers,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    sendUserCredentials,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

