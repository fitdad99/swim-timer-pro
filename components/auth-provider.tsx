"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { useFirebase } from "./firebase-provider"
import { doc, getDoc } from "firebase/firestore"

// Create context with proper typing
interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  error: string | null
  login: (email: string, password: string) => Promise<User | null>
  register: (email: string, password: string) => Promise<User | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, db, initialized, error: firebaseError } = useFirebase()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set error from Firebase provider if it exists
    if (firebaseError) {
      setError(firebaseError)
      setLoading(false)
    }
  }, [firebaseError])

  // Check if user has admin role
  const checkAdminStatus = async (userId: string) => {
    if (!db) return false
    
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        return userDoc.data()?.isAdmin === true
      }
      return false
    } catch (err) {
      console.error("Error checking admin status:", err)
      return false
    }
  }

  useEffect(() => {
    if (!auth || !initialized || !db) {
      // If Firebase is not initialized yet, we're still loading
      return
    }

    // Check if auth is properly configured
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user)
        
        if (user) {
          // Check if user is an admin
          const adminStatus = await checkAdminStatus(user.uid)
          setIsAdmin(adminStatus)
        } else {
          setIsAdmin(false)
        }
        
        setLoading(false)
      })

      return () => unsubscribe()
    } catch (error) {
      console.error("Auth state monitoring error:", error)
      setError("Failed to monitor authentication state. Authentication may not be properly configured.")
      setLoading(false)
    }
  }, [auth, initialized, db])

  const login = async (email: string, password: string): Promise<User | null> => {
    if (!auth) {
      setError("Authentication not initialized")
      return null
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const adminStatus = await checkAdminStatus(userCredential.user.uid)
      setIsAdmin(adminStatus)
      return userCredential.user
    } catch (error) {
      let errorMessage = "Login failed"

      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        console.error("Login error:", error.message)

        if (error.message.includes("auth/configuration-not-found")) {
          errorMessage =
            "Firebase Authentication is not properly configured. Please ensure Authentication is enabled in your Firebase project."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      return null
    }
  }

  const register = async (email: string, password: string): Promise<User | null> => {
    if (!auth) {
      setError("Authentication not initialized")
      return null
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      let errorMessage = "Registration failed"

      // Handle specific Firebase auth errors
      if (error instanceof Error) {
        console.error("Registration error:", error.message)

        if (error.message.includes("auth/configuration-not-found")) {
          errorMessage =
            "Firebase Authentication is not properly configured. Please ensure Authentication is enabled in your Firebase project."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      return null
    }
  }

  const logout = async (): Promise<void> => {
    if (!auth) {
      setError("Authentication not initialized")
      return
    }

    try {
      await signOut(auth)
      setIsAdmin(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Logout failed"
      console.error("Logout error:", errorMessage)
      setError(errorMessage)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    error,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

