// lib/ai/status-types.ts
// AI 작업 상태 관리를 위한 타입 정의
// 요약, 태그 생성 등 AI 작업의 상태를 추적하고 관리
// 관련 파일: lib/ai/status-store.ts, components/ai/status-indicator.tsx

export enum AITaskStatus {
  IDLE = 'idle',
  LOADING = 'loading', 
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled'
}

export enum AITaskType {
  SUMMARY = 'summary',
  TAGS = 'tags'
}

export interface AITaskState {
  id: string
  type: AITaskType
  status: AITaskStatus
  progress?: number
  message?: string
  error?: string
  startTime?: Date
  endTime?: Date
  result?: unknown
}

export interface AIStatusStore {
  tasks: Map<string, AITaskState>
  setTaskStatus: (taskId: string, state: Partial<AITaskState>) => void
  getTaskStatus: (taskId: string) => AITaskState | undefined
  clearTask: (taskId: string) => void
  clearAllTasks: () => void
  createTask: (type: AITaskType, id?: string) => string
}

export type AIStatusContextType = AIStatusStore
