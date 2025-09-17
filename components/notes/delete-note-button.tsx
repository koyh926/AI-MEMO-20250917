// components/notes/delete-note-button.tsx
// 노트 삭제 버튼 컴포넌트 - 재사용 가능한 삭제 버튼 및 확인 다이얼로그
// 노트 목록과 상세 페이지에서 공통으로 사용
// 관련 파일: components/notes/delete-confirm-dialog.tsx, lib/notes/actions.ts

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import { deleteNoteAction } from '@/lib/notes/actions'
import { toast } from 'sonner'

interface DeleteNoteButtonProps {
    noteId: string
    noteTitle: string
    variant?: 'default' | 'ghost' | 'outline' | 'destructive'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    onDeleteSuccess?: () => void
    redirectAfterDelete?: boolean
    className?: string
    children?: React.ReactNode
}

export function DeleteNoteButton({
    noteId,
    noteTitle,
    variant = 'ghost',
    size = 'sm',
    onDeleteSuccess,
    redirectAfterDelete = false,
    className,
    children
}: DeleteNoteButtonProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)

        try {
            const result = await deleteNoteAction(noteId)

            if (result.success) {
                toast.success('노트가 삭제되었습니다.')
                
                if (onDeleteSuccess) {
                    onDeleteSuccess()
                }
                
                if (redirectAfterDelete) {
                    router.push('/notes')
                }
            } else {
                toast.error(result.error || '삭제에 실패했습니다.')
            }
        } catch (error) {
            console.error('삭제 중 오류:', error)
            toast.error('삭제 중 오류가 발생했습니다.')
        } finally {
            setIsDeleting(false)
            setShowDialog(false)
        }
    }

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowDialog(true)
                }}
                className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className || ''}`}
                disabled={isDeleting}
            >
                <Trash2 className="w-4 h-4" />
                {children && <span className="ml-2">{children}</span>}
            </Button>

            <DeleteConfirmDialog
                isOpen={showDialog}
                noteTitle={noteTitle}
                onConfirm={handleDelete}
                onCancel={() => setShowDialog(false)}
                isLoading={isDeleting}
            />
        </>
    )
}
