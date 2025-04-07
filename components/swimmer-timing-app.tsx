"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun, PlusCircle, Trash2, Flag, BarChart3, LogOut, Settings, Clock, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useAuth } from "./auth-provider"
import { useFirebase } from "./firebase-provider"
import { LoginForm } from "./login-form"
import { ClubSettings } from "./club-settings"
import { UserManagement } from "./user-management"

// Error display component
const FirebaseErrorDisplay = ({ error }: { error: string }) => {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 my-4">
        <h3 className="text-lg font-semibold mb-2">Firebase Initialization Error</h3>
        <p>{error}</p>
        <div className="mt-4">
          <p className="text-sm">Please check your environment variables and make sure they are correctly set up.</p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
            <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
            <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</li>
            <li>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>NEXT_PUBLIC_FIREBASE_APP_ID</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Add this component after the FirebaseErrorDisplay component
const AuthConfigErrorDisplay = ({ error }: { error: string }) => {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 my-4">
        <h3 className="text-lg font-semibold mb-2">Firebase Authentication Error</h3>
        <p>{error}</p>
        <div className="mt-4">
          <p className="text-sm">To fix this issue:</p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>Ensure Authentication is enabled in your Firebase project console</li>
            <li>Enable Email/Password sign-in method in the Authentication section</li>
            <li>Verify your Firebase configuration values are correct</li>
            <li>Make sure your Firebase project is properly set up</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Loading component
const LoadingDisplay = () => {
  return (
    <div className="container mx-auto max-w-4xl flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Initializing application...</p>
      </div>
    </div>
  )
}

// Define stroke types and distances
const STROKE_TYPES = ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley"]
const DISTANCES = ["25m", "50m", "100m", "200m", "400m", "800m", "1500m"]

interface Lap {
  number: number
  time: number
  splitTime: number
}

interface TimeRecord {
  id: string
  time: number
  date: string | Date // Updated to handle both string and Date
  stroke: string
  distance: string
  laps: Lap[]
}

interface Swimmer {
  id: string
  name: string
  times: TimeRecord[]
  bestLapTimes: Record<number, number> // Lap number -> best split time
}

// Helper function to ensure we have a proper date object
const ensureDate = (dateInput: string | Date | any): Date => {
  if (dateInput instanceof Date) {
    return dateInput
  }

  // Handle string dates
  if (typeof dateInput === "string") {
    return new Date(dateInput)
  }

  // Handle Firestore timestamp objects
  if (dateInput && typeof dateInput === "object") {
    // Firestore timestamp has seconds and nanoseconds
    if (dateInput.seconds !== undefined && dateInput.nanoseconds !== undefined) {
      return new Date(dateInput.seconds * 1000)
    }

    // Handle other timestamp formats
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      return dateInput.toDate()
    }
  }

  // Default to current date if we can't parse
  console.warn("Could not parse date, using current date instead:", dateInput)
  return new Date()
}

// Helper function to format date for display
const formatDate = (dateInput: string | Date | any): string => {
  try {
    const date = ensureDate(dateInput)
    return date.toLocaleString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

export default function SwimmerTimingApp() {
  // Theme hooks
  const { theme, setTheme } = useTheme()

  // Firebase and Auth hooks
  const {
    getSwimmers,
    addSwimmer,
    updateSwimmer,
    deleteSwimmer,
    getClubSettings,
    subscribeToSwimmers,
    initialized,
    error: firebaseError,
  } = useFirebase()

  const { user, isAdmin, logout, error: authError } = useAuth()

  // State hooks - all defined at the top level
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [newSwimmerName, setNewSwimmerName] = useState("")
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedSwimmer, setSelectedSwimmer] = useState<string | null>(null)
  const [selectedStroke, setSelectedStroke] = useState(STROKE_TYPES[0])
  const [selectedDistance, setSelectedDistance] = useState(DISTANCES[1]) // Default to 50m
  const [laps, setLaps] = useState<Lap[]>([])
  const [hasLoggedCurrentTime, setHasLoggedCurrentTime] = useState(false)
  const [timelineView, setTimelineView] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [clubSettings, setClubSettings] = useState({ name: "Swim Club", logoUrl: null })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [userManagementOpen, setUserManagementOpen] = useState(false)
  const [is24HourFormat, setIs24HourFormat] = useState(true)

  // Effect for real-time clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Load time format preference from localStorage
  useEffect(() => {
    const savedFormat = localStorage.getItem("timeFormat")
    if (savedFormat) {
      setIs24HourFormat(savedFormat === "24h")
    }
  }, [])

  // Save time format preference to localStorage
  useEffect(() => {
    localStorage.setItem("timeFormat", is24HourFormat ? "24h" : "12h")
  }, [is24HourFormat])

  // Effect for loading swimmers
  useEffect(() => {
    const loadSwimmers = async () => {
      if (initialized) {
        const swimmersData = await getSwimmers()

        // Process the swimmers data to ensure dates are properly handled
        const processedSwimmers = swimmersData.map((swimmer) => ({
          ...swimmer,
          times: swimmer.times.map((time) => ({
            ...time,
            // Ensure date is properly formatted
            date: time.date,
          })),
        }))

        setSwimmers(processedSwimmers)
      }
    }

    loadSwimmers()

    if (user && initialized) {
      // Set up real-time listener
      const unsubscribe = subscribeToSwimmers((swimmersData) => {
        // Process the swimmers data to ensure dates are properly handled
        const processedSwimmers = swimmersData.map((swimmer) => ({
          ...swimmer,
          times: Array.isArray(swimmer.times)
            ? swimmer.times.map((time) => ({
                ...time,
                // Ensure date is properly formatted
                date: time.date,
              }))
            : [],
        }))

        setSwimmers(processedSwimmers)
      })

      return () => unsubscribe()
    }

    return () => {}
  }, [getSwimmers, subscribeToSwimmers, user, initialized])

  // Effect for loading club settings
  useEffect(() => {
    const loadSettings = async () => {
      if (initialized) {
        const settings = await getClubSettings()
        setClubSettings(settings)
      }
    }

    loadSettings()
  }, [getClubSettings, initialized])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 10)
      }, 10)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  // Format time as mm:ss.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000)
    const seconds = Math.floor((time % 60000) / 1000)
    const milliseconds = Math.floor((time % 1000) / 10)

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  // Format the current time based on the selected format
  const formatCurrentTime = () => {
    if (is24HourFormat) {
      return currentTime.toLocaleTimeString([], { hour12: false })
    } else {
      return currentTime.toLocaleTimeString([], { hour12: true })
    }
  }

  // Format the current date
  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Toggle time format
  const toggleTimeFormat = () => {
    setIs24HourFormat(!is24HourFormat)
  }

  // Timer controls
  const startTimer = () => {
    setIsRunning(true)
    setHasLoggedCurrentTime(false)
  }

  const stopTimer = () => setIsRunning(false)

  const resetTimer = () => {
    setIsRunning(false)
    setTime(0)
    setLaps([])
    setHasLoggedCurrentTime(false)
  }

  // Lap functionality
  const recordLap = () => {
    if (isRunning) {
      const lapNumber = laps.length + 1
      const previousLapTime = laps.length > 0 ? laps[laps.length - 1].time : 0
      const splitTime = time - previousLapTime

      setLaps([
        ...laps,
        {
          number: lapNumber,
          time: time,
          splitTime: splitTime,
        },
      ])
    }
  }

  // Swimmer management
  const handleAddSwimmer = async () => {
    if (newSwimmerName.trim() && isAdmin && initialized) {
      const newSwimmer = {
        name: newSwimmerName.trim(),
        times: [],
        bestLapTimes: {},
      }

      const addedSwimmer = await addSwimmer(newSwimmer)
      if (addedSwimmer) {
        setNewSwimmerName("")
      }
    }
  }

  const handleRemoveSwimmer = async (id: string) => {
    if (isAdmin && initialized) {
      const success = await deleteSwimmer(id)
      if (success && selectedSwimmer === id) {
        setSelectedSwimmer(null)
      }
    }
  }

  // Get the selected swimmer object
  const getSelectedSwimmer = () => {
    return swimmers.find((swimmer) => swimmer.id === selectedSwimmer)
  }

  // Check if a lap split time is better or worse than the personal best
  const compareLapWithBest = (swimmer: Swimmer, lapNumber: number, splitTime: number) => {
    if (!swimmer.bestLapTimes[lapNumber]) return "neutral"

    if (splitTime < swimmer.bestLapTimes[lapNumber]) {
      return "faster"
    } else if (splitTime > swimmer.bestLapTimes[lapNumber]) {
      return "slower"
    }
    return "neutral"
  }

  // Update best lap times for a swimmer
  const updateBestLapTimes = (swimmer: Swimmer, newLaps: Lap[]) => {
    const updatedBestLapTimes = { ...swimmer.bestLapTimes }

    newLaps.forEach((lap) => {
      if (!updatedBestLapTimes[lap.number] || lap.splitTime < updatedBestLapTimes[lap.number]) {
        updatedBestLapTimes[lap.number] = lap.splitTime
      }
    })

    return updatedBestLapTimes
  }

  // Log time for selected swimmer
  const logTime = async () => {
    if (selectedSwimmer && time > 0 && !hasLoggedCurrentTime && initialized) {
      const timeId = Date.now().toString()
      const swimmer = getSelectedSwimmer()

      if (swimmer) {
        // Create the new time record
        const newTimeRecord: TimeRecord = {
          id: timeId,
          time,
          date: new Date().toISOString(), // Store as ISO string for consistency
          stroke: selectedStroke,
          distance: selectedDistance,
          laps: [...laps],
        }

        // Update best lap times
        const updatedBestLapTimes = updateBestLapTimes(swimmer, laps)

        // Update swimmer in Firebase
        const updatedSwimmer = {
          ...swimmer,
          times: [...swimmer.times, newTimeRecord],
          bestLapTimes: updatedBestLapTimes,
        }

        const success = await updateSwimmer(swimmer.id, updatedSwimmer)
        if (success) {
          setHasLoggedCurrentTime(true)
        }
      }
    }
  }

  // Get best time for a swimmer for specific stroke and distance
  const getBestTime = (times: TimeRecord[], stroke?: string, distance?: string) => {
    if (times.length === 0) return null

    const filteredTimes = times.filter(
      (t) => (!stroke || t.stroke === stroke) && (!distance || t.distance === distance),
    )

    if (filteredTimes.length === 0) return null
    return Math.min(...filteredTimes.map((t) => t.time))
  }

  // Get times for a specific swimmer, stroke, and distance, sorted by date
  const getChronologicalTimes = (swimmerId: string, stroke: string, distance: string) => {
    const swimmer = swimmers.find((s) => s.id === swimmerId)
    if (!swimmer) return []

    return swimmer.times
      .filter((t) => t.stroke === stroke && t.distance === distance)
      .sort((a, b) => {
        // Convert both dates to Date objects for comparison
        const dateA = ensureDate(a.date)
        const dateB = ensureDate(b.date)
        return dateA.getTime() - dateB.getTime()
      })
  }

  // Render based on initialization state
  if (firebaseError) {
    return <FirebaseErrorDisplay error={firebaseError} />
  }

  if (!initialized) {
    return <LoadingDisplay />
  }

  // Update the login form section to check for auth configuration errors
  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {clubSettings.logoUrl && (
              <img
                src={clubSettings.logoUrl || "/placeholder.svg"}
                alt={`${clubSettings.name} logo`}
                className="h-10 w-auto"
              />
            )}
            <h1 className="text-2xl font-bold">{clubSettings.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono cursor-pointer" onClick={toggleTimeFormat}>
              <div>{formatCurrentDate()}</div>
              <div>{formatCurrentTime()}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>

        {authError && authError.includes("Authentication is not properly configured") && (
          <AuthConfigErrorDisplay error={authError} />
        )}

        <LoginForm />
      </div>
    )
  }

  // Main application UI
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {clubSettings.logoUrl && (
            <img
              src={clubSettings.logoUrl || "/placeholder.svg"}
              alt={`${clubSettings.name} logo`}
              className="h-10 w-auto"
            />
          )}
          <h1 className="text-2xl font-bold">{clubSettings.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-sm font-mono cursor-pointer" onClick={toggleTimeFormat}>
            <div className="text-muted-foreground">{formatCurrentDate()}</div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatCurrentTime()}
            </div>
          </div>

          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog open={userManagementOpen} onOpenChange={setUserManagementOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Users className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <UserManagement />
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>User Management</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!isAdmin}>
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <ClubSettings onClose={() => setSettingsOpen(false)} />
                  </DialogContent>
                </Dialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>Club Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="Toggle theme"
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle theme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timer Section */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Stopwatch</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-6xl font-mono font-bold mb-6 tabular-nums">{formatTime(time)}</div>

            {/* Stroke and Distance Selection */}
            <div className="grid grid-cols-2 gap-4 w-full mb-6">
              <div className="space-y-2">
                <Label htmlFor="stroke">Stroke</Label>
                <Select value={selectedStroke} onValueChange={setSelectedStroke}>
                  <SelectTrigger id="stroke">
                    <SelectValue placeholder="Select stroke" />
                  </SelectTrigger>
                  <SelectContent>
                    {STROKE_TYPES.map((stroke) => (
                      <SelectItem key={stroke} value={stroke}>
                        {stroke}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance</Label>
                <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                  <SelectTrigger id="distance">
                    <SelectValue placeholder="Select distance" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTANCES.map((distance) => (
                      <SelectItem key={distance} value={distance}>
                        {distance}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex flex-wrap gap-2 justify-center">
              {!isRunning ? (
                <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700">
                  Start
                </Button>
              ) : (
                <Button onClick={stopTimer} className="bg-red-600 hover:bg-red-700">
                  Stop
                </Button>
              )}
              <Button onClick={resetTimer} variant="outline">
                Reset
              </Button>
              <Button onClick={recordLap} disabled={!isRunning} variant="outline" className="flex items-center gap-1">
                <Flag className="h-4 w-4" /> Lap
              </Button>
              <Button
                onClick={logTime}
                disabled={!selectedSwimmer || time === 0 || hasLoggedCurrentTime}
                className={cn("bg-blue-600 hover:bg-blue-700", hasLoggedCurrentTime && "opacity-50 cursor-not-allowed")}
              >
                {hasLoggedCurrentTime ? "Logged" : "Log Time"}
              </Button>
            </div>

            {/* Lap Times */}
            {laps.length > 0 && (
              <div className="w-full mt-6">
                <h3 className="text-sm font-medium mb-2">Lap Times</h3>
                <ScrollArea className="h-[150px] w-full rounded-md border">
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Lap</TableHead>
                          <TableHead>Split</TableHead>
                          <TableHead>Total</TableHead>
                          {selectedSwimmer && <TableHead>Status</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {laps.map((lap) => {
                          const selectedSwimmerObj = getSelectedSwimmer()
                          const comparisonResult = selectedSwimmerObj
                            ? compareLapWithBest(selectedSwimmerObj, lap.number, lap.splitTime)
                            : "neutral"

                          return (
                            <TableRow key={lap.number}>
                              <TableCell className="font-medium">{lap.number}</TableCell>
                              <TableCell
                                className={cn(
                                  "font-mono",
                                  comparisonResult === "faster" && "text-green-500 dark:text-green-400",
                                  comparisonResult === "slower" && "text-red-500 dark:text-red-400",
                                )}
                              >
                                {formatTime(lap.splitTime)}
                              </TableCell>
                              <TableCell className="font-mono">{formatTime(lap.time)}</TableCell>
                              {selectedSwimmer && (
                                <TableCell>
                                  {comparisonResult === "faster" && <Badge className="bg-green-600">Faster</Badge>}
                                  {comparisonResult === "slower" && <Badge className="bg-red-600">Slower</Badge>}
                                  {comparisonResult === "neutral" && selectedSwimmerObj?.bestLapTimes[lap.number] && (
                                    <Badge variant="outline">Same</Badge>
                                  )}
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Swimmer Management */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Swimmers</CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin && (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Swimmer name"
                  value={newSwimmerName}
                  onChange={(e) => setNewSwimmerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSwimmer()}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleAddSwimmer} size="icon">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new swimmer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}

            <ScrollArea className="h-[300px] rounded-md border p-2">
              {swimmers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No swimmers added yet</div>
              ) : (
                <div className="space-y-2">
                  {swimmers.map((swimmer) => (
                    <div
                      key={swimmer.id}
                      className={`flex justify-between items-center p-2 rounded-md ${
                        selectedSwimmer === swimmer.id ? "bg-primary/10 dark:bg-primary/20" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedSwimmer(swimmer.id)}>
                        <div className="font-medium">{swimmer.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {swimmer.times.length} times recorded
                          {getBestTime(swimmer.times, selectedStroke, selectedDistance) !== null && (
                            <span>
                              {" "}
                              • Best {selectedStroke} {selectedDistance}:{" "}
                              {formatTime(getBestTime(swimmer.times, selectedStroke, selectedDistance)!)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {swimmer.times.length > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setTimelineView(swimmer.id)}
                                  className="h-8 w-8 mr-1"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View performance timeline</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {isAdmin && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveSwimmer(swimmer.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove swimmer</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Times Display */}
      <Tabs defaultValue="table" className="mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recorded Times</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Swimmer</TableHead>
                    <TableHead>Stroke</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Laps</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swimmers.flatMap((swimmer) =>
                    swimmer.times.map((timeRecord) => {
                      const bestTime = getBestTime(swimmer.times, timeRecord.stroke, timeRecord.distance)
                      const isPersonalBest = timeRecord.time === bestTime

                      return (
                        <TableRow key={timeRecord.id}>
                          <TableCell className="font-medium">{swimmer.name}</TableCell>
                          <TableCell>{timeRecord.stroke}</TableCell>
                          <TableCell>{timeRecord.distance}</TableCell>
                          <TableCell className="font-mono">{formatTime(timeRecord.time)}</TableCell>
                          <TableCell>{formatDate(timeRecord.date)}</TableCell>
                          <TableCell>{timeRecord.laps.length}</TableCell>
                          <TableCell>{isPersonalBest && <Badge className="bg-green-600">PB</Badge>}</TableCell>
                        </TableRow>
                      )
                    }),
                  )}
                  {swimmers.flatMap((s) => s.times).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No times recorded yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {swimmers.map((swimmer) => (
              <Card key={swimmer.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{swimmer.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  {swimmer.times.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Best Times</h3>
                        <div className="space-y-1">
                          {STROKE_TYPES.map((stroke) => {
                            const bestTimeForStroke = getBestTime(swimmer.times, stroke, selectedDistance)
                            if (bestTimeForStroke) {
                              return (
                                <div key={stroke} className="flex justify-between text-sm">
                                  <span>
                                    {stroke} {selectedDistance}
                                  </span>
                                  <span className="font-mono">{formatTime(bestTimeForStroke)}</span>
                                </div>
                              )
                            }
                            return null
                          }).filter(Boolean)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Recent Times</h3>
                        <ScrollArea className="h-[100px]">
                          <div className="space-y-1">
                            {[...swimmer.times]
                              .sort((a, b) => {
                                // Sort by date in descending order (newest first)
                                const dateA = ensureDate(a.date)
                                const dateB = ensureDate(b.date)
                                return dateB.getTime() - dateA.getTime()
                              })
                              .slice(0, 5)
                              .map((timeRecord) => (
                                <div key={timeRecord.id} className="grid grid-cols-[1fr,auto] gap-1 text-sm">
                                  <div className="flex items-center gap-1">
                                    <span>{timeRecord.stroke}</span>
                                    <span className="text-xs text-muted-foreground">{timeRecord.distance}</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-mono">{formatTime(timeRecord.time)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(timeRecord.date).split(",")[0]}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">No times recorded</div>
                  )}
                </CardContent>
              </Card>
            ))}
            {swimmers.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Add swimmers to see their times here
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Chronological Performance View */}
      {timelineView && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{swimmers.find((s) => s.id === timelineView)?.name} - Performance Timeline</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setTimelineView(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={STROKE_TYPES[0]}>
              <TabsList className="flex flex-wrap">
                {STROKE_TYPES.map((stroke) => (
                  <TabsTrigger key={stroke} value={stroke} className="flex-grow">
                    {stroke}
                  </TabsTrigger>
                ))}
              </TabsList>

              {STROKE_TYPES.map((stroke) => (
                <TabsContent key={stroke} value={stroke} className="mt-4">
                  <div className="space-y-4">
                    {DISTANCES.map((distance) => {
                      const chronologicalTimes = getChronologicalTimes(timelineView, stroke, distance)

                      if (chronologicalTimes.length === 0) return null

                      // Find the best time for this stroke/distance
                      const bestTime = Math.min(...chronologicalTimes.map((t) => t.time))

                      return (
                        <div key={distance} className="space-y-2">
                          <h3 className="text-sm font-medium">{distance}</h3>
                          <div className="rounded-md border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Improvement</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {chronologicalTimes.map((record, index) => {
                                  const previousTime = index > 0 ? chronologicalTimes[index - 1].time : null
                                  const improvement = previousTime ? previousTime - record.time : 0
                                  const isPB = record.time === bestTime

                                  return (
                                    <TableRow key={record.id}>
                                      <TableCell>{formatDate(record.date)}</TableCell>
                                      <TableCell
                                        className={cn(
                                          "font-mono",
                                          isPB && "font-bold text-green-500 dark:text-green-400",
                                        )}
                                      >
                                        {formatTime(record.time)}
                                        {isPB && " (PB)"}
                                      </TableCell>
                                      <TableCell>
                                        {improvement > 0 ? (
                                          <span className="text-green-500 dark:text-green-400">
                                            -{formatTime(improvement)}
                                          </span>
                                        ) : index === 0 ? (
                                          <span className="text-muted-foreground">First time</span>
                                        ) : (
                                          <span className="text-red-500 dark:text-red-400">
                                            +{formatTime(Math.abs(improvement))}
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )
                    }).filter(Boolean)}

                    {!DISTANCES.some(
                      (distance) => getChronologicalTimes(timelineView, stroke, distance).length > 0,
                    ) && (
                      <div className="text-center py-8 text-muted-foreground">No data recorded for {stroke} yet</div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

