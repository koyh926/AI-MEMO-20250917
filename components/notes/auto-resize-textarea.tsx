// components/notes/auto-resize-textarea.tsx
// 자동 크기 조절 텍스트 영역 - 내용에 따라 높이가 자동으로 조절되는 textarea
// 노트 본문 편집 시 사용되어 사용자 경험을 개선
// 관련 파일: components/notes/note-editor.tsx, components/ui/textarea.tsx

'use client'

import { forwardRef, useEffect, useRef, useImperativeHandle, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface AutoResizeTextareaProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    minRows?: number
    maxRows?: number
    disabled?: boolean
}

export const AutoResizeTextarea = forwardRef<
    HTMLTextAreaElement,
    AutoResizeTextareaProps
>(function AutoResizeTextarea({ 
    value, 
    onChange, 
    placeholder = '노트 내용을 입력하세요...', 
    className,
    minRows = 3,
    maxRows = 20,
    disabled = false
}, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => textareaRef.current!)

    // 높이 자동 조절 함수
    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        // 높이 초기화
        textarea.style.height = 'auto'
        
        // 스크롤 높이를 기반으로 새 높이 계산
        const scrollHeight = textarea.scrollHeight
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
        const paddingTop = parseInt(getComputedStyle(textarea).paddingTop)
        const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom)
        
        const minHeight = lineHeight * minRows + paddingTop + paddingBottom
        const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom
        
        const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight))
        textarea.style.height = `${newHeight}px`
        
        // 최대 높이에 도달했을 때 스크롤 표시
        if (scrollHeight > maxHeight) {
            textarea.style.overflowY = 'auto'
        } else {
            textarea.style.overflowY = 'hidden'
        }
    }, [minRows, maxRows])

    // value 변경 시 높이 조절
    useEffect(() => {
        adjustHeight()
    }, [value, adjustHeight])

    // 컴포넌트 마운트 시 초기 높이 설정
    useEffect(() => {
        adjustHeight()
    }, [adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Cmd/Ctrl + S 키 조합은 부모에서 처리하도록 버블링
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault()
            // 커스텀 이벤트 발생
            const saveEvent = new CustomEvent('save-shortcut')
            textareaRef.current?.dispatchEvent(saveEvent)
        }
    }

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
                'resize-none transition-all duration-200 focus:ring-2 focus:ring-blue-500/20',
                className
            )}
            style={{
                overflowY: 'hidden'
            }}
        />
    )
})
