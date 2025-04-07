"use client"

import { useState, useEffect } from "react"
import { useFirebase } from "./firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Upload } from "lucide-react"

export function ClubSettings({ onClose }) {
  const { getClubSettings, updateClubSettings, uploadLogo } = useFirebase()
  const [clubName, setClubName] = useState("")
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getClubSettings()
      setClubName(settings.name || "")
      setCurrentLogoUrl(settings.logoUrl || null)
    }

    loadSettings()
  }, [getClubSettings])

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    try {
      let logoUrl = currentLogoUrl

      // Upload new logo if selected
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile)
        if (!logoUrl) {
          throw new Error("Failed to upload logo")
        }
      }

      // Update settings
      const success = await updateClubSettings({
        name: clubName,
        logoUrl,
      })

      if (success) {
        setSuccess(true)
        setTimeout(() => {
          if (onClose) onClose()
        }, 1500)
      } else {
        throw new Error("Failed to update settings")
      }
    } catch (error) {
      setError(error.message || "An error occurred")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Club Settings</CardTitle>
        <CardDescription>Customize your swim club information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="club-name">Club Name</Label>
            <Input id="club-name" value={clubName} onChange={(e) => setClubName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Club Logo</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <Button type="button" variant="outline" className="w-full flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {logoFile ? logoFile.name : "Choose Logo"}
                  </Button>
                </div>
              </div>

              {/* Logo Preview */}
              {(logoPreview || currentLogoUrl) && (
                <div className="h-16 w-16 rounded-md overflow-hidden border flex items-center justify-center bg-muted">
                  <img
                    src={logoPreview || currentLogoUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>Settings updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

