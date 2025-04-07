"use client"

import { useState, useEffect, useCallback } from "react"
import { useFirebase } from "@/components/firebase-provider"
import { Swimmer, TimeRecord } from "@/lib/types"
import { generateId } from "@/lib/utils"

export function useSwimmers() {
  const { getSwimmers, addSwimmer, updateSwimmer, deleteSwimmer, subscribeToSwimmers } = useFirebase()
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [selectedSwimmer, setSelectedSwimmer] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load swimmers on mount and set up real-time updates
  useEffect(() => {
    const fetchSwimmers = async () => {
      setLoading(true)
      try {
        const swimmersData = await getSwimmers()
        setSwimmers(swimmersData)
        setLoading(false)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(`Failed to load swimmers: ${errorMessage}`)
        setLoading(false)
      }
    }

    // Set up real-time subscription
    const unsubscribe = subscribeToSwimmers((swimmersData) => {
      setSwimmers(swimmersData)
      setLoading(false)
    })

    // Initial fetch
    fetchSwimmers()

    // Clean up subscription
    return () => unsubscribe()
  }, [getSwimmers, subscribeToSwimmers])

  // Create a new swimmer
  const createSwimmer = useCallback(async (name: string) => {
    if (!name.trim()) {
      setError("Swimmer name cannot be empty")
      return null
    }

    try {
      const newSwimmer = await addSwimmer({
        name: name.trim(),
        times: [],
        bestLapTimes: {},
      })
      
      return newSwimmer
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to create swimmer: ${errorMessage}`)
      return null
    }
  }, [addSwimmer])

  // Remove a swimmer
  const removeSwimmer = useCallback(async (swimmerId: string) => {
    try {
      await deleteSwimmer(swimmerId)
      if (selectedSwimmer === swimmerId) {
        setSelectedSwimmer(null)
      }
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to delete swimmer: ${errorMessage}`)
      return false
    }
  }, [deleteSwimmer, selectedSwimmer])

  // Add a time record for a swimmer
  const addTimeRecord = useCallback(async (
    swimmerId: string,
    time: number,
    laps: any[],
    stroke: string,
    distance: string
  ) => {
    try {
      const swimmer = swimmers.find(s => s.id === swimmerId)
      if (!swimmer) {
        setError("Swimmer not found")
        return false
      }

      // Create a new time record
      const timeRecord: TimeRecord = {
        id: generateId(),
        time,
        date: new Date().toISOString(),
        stroke,
        distance,
        laps
      }

      // Update best lap times
      const bestLapTimes = { ...swimmer.bestLapTimes }
      laps.forEach(lap => {
        if (!bestLapTimes[lap.number] || lap.splitTime < bestLapTimes[lap.number]) {
          bestLapTimes[lap.number] = lap.splitTime
        }
      })

      // Add the time record to the swimmer
      const times = [...swimmer.times, timeRecord]
      
      // Update the swimmer in Firestore
      await updateSwimmer(swimmerId, { times, bestLapTimes })
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Failed to add time record: ${errorMessage}`)
      return false
    }
  }, [swimmers, updateSwimmer])

  return {
    swimmers,
    selectedSwimmer,
    setSelectedSwimmer,
    loading,
    error,
    createSwimmer,
    removeSwimmer,
    addTimeRecord
  }
} 