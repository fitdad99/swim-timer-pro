import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to ensure we have a proper date object
export const ensureDate = (dateInput: string | Date | any): Date => {
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
export const formatDate = (dateInput: string | Date | any): string => {
  try {
    const date = ensureDate(dateInput)
    return date.toLocaleString()
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

// Format time in MM:SS.ms format
export const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60000)
  const seconds = Math.floor((time % 60000) / 1000)
  const milliseconds = Math.floor((time % 1000) / 10)

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(2, "0")}`
}

// Format a single lap time
export const formatLapTime = (time: number): string => {
  return formatTime(time)
}

// Format current time based on 12h/24h preference
export const formatCurrentTime = (date: Date, is24Hour: boolean): string => {
  if (is24Hour) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } else {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }
}

// Generate a unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
