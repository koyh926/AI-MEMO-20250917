// lib/notes/hooks.ts
// 노트 편집 관련 커스텀 훅 - 자동 저장, 로컬 스토리지 백업 등
// 노트 편집기에서 사용되는 상태 관리 및 자동 저장 로직
// 관련 파일: components/notes/note-editor.tsx, lib/notes/actions.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { debounce } from '@/lib/utils/debounce'
import { updateNoteAction } from './actions'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveProps {
    noteId: string
    initialTitle: string
    initialContent: string
    delay?: number
}

interface UseAutoSaveReturn {
    title: string
    content: string
    saveStatus: SaveStatus
    setTitle: (title: string) => void
    setContent: (content: string) => void
    saveNow: () => Promise<void>
    hasUnsavedChanges: boolean
}

export function useAutoSave({
    noteId,
    initialTitle,
    initialContent,
    delay = 3000
}: UseAutoSaveProps): UseAutoSaveReturn {
    const [title, setTitle] = useState(initialTitle)
    const [content, setContent] = useState(initialContent)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    
    const lastSavedRef = useRef({ title: initialTitle, content: initialContent })
    const savingRef = useRef(false)

    // 로컬 스토리지 키
    const localStorageKey = `note-draft-${noteId}`

    // 로컬 스토리지에서 복원
    useEffect(() => {
        try {
            const saved = localStorage.getItem(localStorageKey)
            if (saved) {
                const { title: savedTitle, content: savedContent, lastModified } = JSON.parse(saved)
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
                
                // 5분 이내의 변경사항만 복원
                if (lastModified > fiveMinutesAgo) {
                    setTitle(savedTitle)
                    setContent(savedContent)
                    setHasUnsavedChanges(true)
                }
            }
        } catch (error) {
            console.error('로컬 스토리지 복원 실패:', error)
        }
    }, [localStorageKey])

    // 로컬 스토리지에 백업
    useEffect(() => {
        if (hasUnsavedChanges) {
            try {
                localStorage.setItem(localStorageKey, JSON.stringify({
                    title,
                    content,
                    lastModified: Date.now()
                }))
            } catch (error) {
                console.error('로컬 스토리지 저장 실패:', error)
            }
        }
    }, [title, content, hasUnsavedChanges, localStorageKey])

    // 변경사항 감지
    useEffect(() => {
        const hasChanges = title !== lastSavedRef.current.title || 
                          content !== lastSavedRef.current.content
        setHasUnsavedChanges(hasChanges)
    }, [title, content])

    // 실제 저장 함수
    const saveNote = useCallback(async () => {
        if (savingRef.current || !hasUnsavedChanges) return

        savingRef.current = true
        setSaveStatus('saving')

        try {
            const result = await updateNoteAction(noteId, { title, content })
            
            if (result.success) {
                setSaveStatus('saved')
                lastSavedRef.current = { title, content }
                setHasUnsavedChanges(false)
                
                // 로컬 스토리지 정리
                try {
                    localStorage.removeItem(localStorageKey)
                } catch (error) {
                    console.error('로컬 스토리지 정리 실패:', error)
                }
                
                // 2초 후 상태 초기화
                setTimeout(() => {
                    setSaveStatus('idle')
                }, 2000)
            } else {
                setSaveStatus('error')
                console.error('저장 실패:', result.error)
            }
        } catch (error) {
            setSaveStatus('error')
            console.error('저장 중 오류:', error)
        } finally {
            savingRef.current = false
        }
    }, [noteId, title, content, hasUnsavedChanges, localStorageKey])

    // debounce된 자동 저장
    const debouncedSave = useCallback(() => {
        const debouncedFn = debounce(() => {
            if (hasUnsavedChanges && !savingRef.current) {
                saveNote()
            }
        }, delay)
        return debouncedFn()
    }, [saveNote, hasUnsavedChanges, delay])

    // 자동 저장 트리거
    useEffect(() => {
        if (hasUnsavedChanges) {
            debouncedSave()
        }
    }, [title, content, debouncedSave, hasUnsavedChanges])

    // 즉시 저장
    const saveNow = useCallback(async () => {
        if (hasUnsavedChanges && !savingRef.current) {
            await saveNote()
        }
    }, [saveNote, hasUnsavedChanges])

    return {
        title,
        content,
        saveStatus,
        setTitle,
        setContent,
        saveNow,
        hasUnsavedChanges
    }
}
