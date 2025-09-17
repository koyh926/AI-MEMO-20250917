// components/notes/save-status.tsx
// 저장 상태 표시 컴포넌트 - 자동 저장 상태를 시각적으로 표시
// 저장 중, 저장 완료, 저장 실패 상태를 아이콘과 텍스트로 표현
// 관련 파일: components/notes/note-editor.tsx, lib/notes/hooks.ts

'use client'

import { CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SaveStatus } from '@/lib/notes/hooks'

interface SaveStatusProps {
    status: SaveStatus
    onRetry?: () => void
    className?: string
}

export function SaveStatusDisplay({ status, onRetry, className }: SaveStatusProps) {
    if (status === 'idle') {
        return null
    }

    const getStatusContent = () => {
        switch (status) {
            case 'saving':
                return {
                    icon: <Loader2 className="w-4 h-4 animate-spin" />,
                    text: '저장 중...',
                    className: 'text-blue-600'
                }
            case 'saved':
                return {
                    icon: <CheckCircle className="w-4 h-4" />,
                    text: '저장됨',
                    className: 'text-green-600'
                }
            case 'error':
                return {
                    icon: <AlertCircle className="w-4 h-4" />,
                    text: '저장 실패',
                    className: 'text-red-600'
                }
            default:
                return null
        }
    }

    const statusContent = getStatusContent()
    if (!statusContent) return null

    return (
        <div className={`flex items-center gap-2 ${className || ''}`}>
            <div className={`flex items-center gap-1 text-sm ${statusContent.className}`}>
                {statusContent.icon}
                <span>{statusContent.text}</span>
            </div>
            
            {status === 'error' && onRetry && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="h-auto p-1 text-red-600 hover:text-red-700"
                >
                    <RefreshCw className="w-3 h-3" />
                </Button>
            )}
        </div>
    )
}
