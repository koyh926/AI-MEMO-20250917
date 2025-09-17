// lib/ai/status-store.tsx
// AI 작업 상태 관리를 위한 React Context Provider
// 여러 AI 작업의 상태를 동시에 추적하고 관리
// 관련 파일: lib/ai/status-types.ts, components/ai/status-indicator.tsx

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { AITaskState, AITaskStatus, AITaskType, AIStatusStore } from './status-types'

const AIStatusContext = createContext<AIStatusStore | null>(null)

export function useAIStatus(): AIStatusStore {
  const context = useContext(AIStatusContext)
  if (!context) {
    throw new Error('useAIStatus must be used within an AIStatusProvider')
  }
  return context
}

interface AIStatusProviderProps {
  children: React.ReactNode
}

export function AIStatusProvider({ children }: AIStatusProviderProps) {
  const [tasks, setTasks] = useState<Map<string, AITaskState>>(new Map())

  const setTaskStatus = useCallback((taskId: string, updates: Partial<AITaskState>) => {
    setTasks(prevTasks => {
      const newTasks = new Map(prevTasks)
      const existingTask = newTasks.get(taskId)
      
      if (existingTask) {
        newTasks.set(taskId, {
          ...existingTask,
          ...updates,
          endTime: updates.status === AITaskStatus.SUCCESS || 
                   updates.status === AITaskStatus.ERROR || 
                   updates.status === AITaskStatus.TIMEOUT || 
                   updates.status === AITaskStatus.CANCELLED ? new Date() : existingTask.endTime
        })
      } else if (updates.type) {
        // 새 작업 생성
        newTasks.set(taskId, {
          id: taskId,
          type: updates.type,
          status: updates.status || AITaskStatus.IDLE,
          startTime: new Date(),
          ...updates
        })
      }
      
      return newTasks
    })
  }, [])

  const getTaskStatus = useCallback((taskId: string): AITaskState | undefined => {
    return tasks.get(taskId)
  }, [tasks])

  const clearTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const newTasks = new Map(prevTasks)
      newTasks.delete(taskId)
      return newTasks
    })
  }, [])

  const clearAllTasks = useCallback(() => {
    setTasks(new Map())
  }, [])

  const createTask = useCallback((type: AITaskType, id?: string): string => {
    const taskId = id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setTaskStatus(taskId, {
      type,
      status: AITaskStatus.IDLE,
      startTime: new Date()
    })
    
    return taskId
  }, [setTaskStatus])

  const store: AIStatusStore = {
    tasks,
    setTaskStatus,
    getTaskStatus,
    clearTask,
    clearAllTasks,
    createTask
  }

  return (
    <AIStatusContext.Provider value={store}>
      {children}
    </AIStatusContext.Provider>
  )
}
