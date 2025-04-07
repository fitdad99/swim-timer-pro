"use client"

import { useState, useEffect, useCallback } from "react"
import { useFirebase } from "@/components/firebase-provider"
import { ClubSettings } from "@/lib/types"

export function useClubSettings() {
  const { getClubSettings, updateClubSettings, uploadLogo } = useFirebase()
  const [settings, setSettings] = useState<ClubSettings>({ name: "Swim Club", logoUrl: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const settingsData = await getClubSettings()
        if (settingsData) {
          setSettings(settingsData)
        }
        setLoading(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(`Failed to load club settings: ${errorMessage}`)
        setLoading(false)
      }
    }

    fetchSettings()
  }, [getClubSettings])

  // Update club settings
  const saveSettings = useCallback(async (newSettings: Partial<ClubSettings>) => {
    setLoading(true)
    try {
      // Merge with existing settings
      const updatedSettings = { ...settings, ...newSettings }
      
      // Update in Firestore
      const success = await updateClubSettings(updatedSettings)
      
      if (success) {
        setSettings(updatedSettings)
      } else {
        setError("Failed to update club settings")
      }
      
      setLoading(false)
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to update club settings: ${errorMessage}`)
      setLoading(false)
      return false
    }
  }, [settings, updateClubSettings])

  // Upload club logo
  const uploadClubLogo = useCallback(async (file: File) => {
    if (!file) {
      setError("No file selected")
      return false
    }

    setLoading(true)
    try {
      // Upload to Firebase Storage
      const logoUrl = await uploadLogo(file)
      
      if (logoUrl) {
        // Update settings with new logo URL
        await saveSettings({ logoUrl })
        setLoading(false)
        return true
      } else {
        setError("Failed to upload logo")
        setLoading(false)
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to upload logo: ${errorMessage}`)
      setLoading(false)
      return false
    }
  }, [uploadLogo, saveSettings])

  return {
    settings,
    loading,
    error,
    saveSettings,
    uploadClubLogo
  }
} 