"use client"

import { useState, useEffect } from "react"
import { useFirebase } from "./firebase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Plus, Trash2, ShieldCheck } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Define user interface for type safety
interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt?: string | Date;
}

// Function to generate a random password
const generateRandomPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function UserManagement() {
  const { getUsers, addUser, deleteUser, sendUserCredentials, updateUser } = useFirebase()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserName, setNewUserName] = useState("")
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const usersData = await getUsers()
      setUsers(usersData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to load users: " + errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) {
      setError("Email and name are required")
      return
    }

    setAddingUser(true)
    setError("")
    setSuccess("")

    try {
      // Generate a random password
      const password = generateRandomPassword()
      setGeneratedPassword(password)

      // Create the user
      await addUser({
        email: newUserEmail,
        password,
        displayName: newUserName,
        isAdmin: newUserIsAdmin,
        createdAt: new Date().toISOString()
      })

      // Reload the user list
      await loadUsers()

      setSuccess("User created successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to create user: " + errorMessage)
      console.error(err)
    } finally {
      setAddingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await deleteUser(userId)
      await loadUsers()
      setSuccess("User deleted successfully")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to delete user: " + errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await updateUser(userId, { isAdmin: !isCurrentlyAdmin })
      await loadUsers()
      setSuccess(`User admin status ${!isCurrentlyAdmin ? 'granted' : 'revoked'} successfully`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to update user: " + errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCredentials = async () => {
    if (!newUserEmail || !newUserName || !generatedPassword) {
      setError("Cannot send credentials: missing information")
      return
    }

    setSendingEmail(true)
    setError("")

    try {
      await sendUserCredentials({
        email: newUserEmail,
        name: newUserName,
        password: generatedPassword,
        isAdmin: newUserIsAdmin
      })

      setSuccess("Credentials sent successfully")

      // Reset form after successful send
      setNewUserEmail("")
      setNewUserName("")
      setNewUserIsAdmin(false)
      setGeneratedPassword("")
      setShowAddUserDialog(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError("Failed to send credentials: " + errorMessage)
      console.error(err)
    } finally {
      setSendingEmail(false)
    }
  }

  const resetForm = () => {
    setNewUserEmail("")
    setNewUserName("")
    setNewUserIsAdmin(false)
    setGeneratedPassword("")
    setError("")
    setSuccess("")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage users who can access the system</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">System Users</h3>

              <Dialog
                open={showAddUserDialog}
                onOpenChange={(open) => {
                  setShowAddUserDialog(open)
                  if (!open) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account and send login credentials</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Enter user's name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="Enter user's email"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="admin" 
                        checked={newUserIsAdmin}
                        onCheckedChange={(checked) => setNewUserIsAdmin(checked === true)}
                      />
                      <Label htmlFor="admin" className="cursor-pointer">Grant administrator privileges</Label>
                    </div>

                    {generatedPassword && (
                      <div className="bg-muted p-3 rounded-md mt-4">
                        <p className="text-sm font-medium mb-1">Generated Password:</p>
                        <code className="bg-background px-2 py-1 rounded text-sm">{generatedPassword}</code>
                        <p className="text-xs text-muted-foreground mt-2">
                          Copy this password or use the send credentials button below.
                        </p>
                      </div>
                    )}

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    {generatedPassword ? (
                      <Button
                        className="flex items-center gap-2"
                        onClick={handleSendCredentials}
                        disabled={sendingEmail}
                        variant="outline"
                      >
                        <Mail className="h-4 w-4" />
                        {sendingEmail ? "Sending..." : "Send Credentials"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAddUser}
                        disabled={addingUser || !newUserEmail || !newUserName}
                      >
                        {addingUser ? "Creating..." : "Create User"}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading users...</TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">No users found</TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.displayName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {user.isAdmin ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                                <ShieldCheck className="h-4 w-4" /> Admin
                              </span>
                            ) : (
                              "User"
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, Boolean(user.isAdmin))}
                            >
                              {user.isAdmin ? "Revoke Admin" : "Make Admin"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

