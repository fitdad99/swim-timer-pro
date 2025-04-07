"use client"

import { useState } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

// Add this component after the imports
const AuthConfigError = () => (
  <Alert variant="destructive" className="mb-4">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      <p className="font-medium">Firebase Authentication is not configured properly</p>
      <p className="text-sm mt-1">
        Please ensure that:
        <ul className="list-disc list-inside mt-1 ml-2 text-xs">
          <li>Authentication is enabled in your Firebase project console</li>
          <li>Email/Password sign-in method is enabled</li>
          <li>Your Firebase configuration is correct</li>
        </ul>
      </p>
    </AlertDescription>
  </Alert>
)

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, error: authError } = useAuth()

  // Use the error from auth context if available
  const error = localError || authError

  const handleLogin = async (e) => {
    e.preventDefault()
    setLocalError("")
    setIsLoading(true)

    try {
      const user = await login(email, password)
      if (!user) {
        setLocalError("Failed to login. Please check your credentials.")
      }
    } catch (error) {
      setLocalError("Failed to login. Please check your credentials.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Swimmer Timing System</CardTitle>
        <CardDescription>Login to access the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error &&
            (error.includes("Authentication is not properly configured") ? (
              <AuthConfigError />
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground text-center">
        <p>Contact an administrator if you need access</p>
      </CardFooter>
    </Card>
  )
}

