"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Lap } from "@/lib/types"
import { generateId } from "@/lib/utils"

interface UseTimerProps {
  onComplete?: (time: number, laps: Lap[]) => void
}

export function useTimer({ onComplete }: UseTimerProps = {}) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<Lap[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastLapTimeRef = useRef<number>(0)

  // Start the timer
  const startTimer = useCallback(() => {
    if (isRunning) return

    setIsRunning(true)
    const startTime = Date.now() - time
    startTimeRef.current = startTime
    
    if (laps.length === 0) {
      lastLapTimeRef.current = startTime
    }

    intervalRef.current = setInterval(() => {
      const currentTime = Date.now() - startTime
      setTime(currentTime)
    }, 10)
  }, [isRunning, time, laps])

  // Stop the timer
  const stopTimer = useCallback(() => {
    if (!isRunning) return

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setIsRunning(false)
    
    // Call onComplete if provided
    if (onComplete) {
      onComplete(time, laps)
    }
  }, [isRunning, time, laps, onComplete])

  // Reset the timer
  const resetTimer = useCallback(() => {
    stopTimer()
    setTime(0)
    setLaps([])
    lastLapTimeRef.current = 0
  }, [stopTimer])

  // Record a lap
  const recordLap = useCallback(() => {
    if (!isRunning) return

    const now = Date.now()
    const lapTime = now - lastLapTimeRef.current
    const lapNumber = laps.length + 1
    
    const newLap: Lap = {
      number: lapNumber,
      time: time,
      splitTime: lapTime
    }
    
    setLaps((prevLaps) => [...prevLaps, newLap])
    lastLapTimeRef.current = now
  }, [isRunning, time, laps])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    time,
    isRunning,
    laps,
    startTimer,
    stopTimer,
    resetTimer,
    recordLap
  }
} 