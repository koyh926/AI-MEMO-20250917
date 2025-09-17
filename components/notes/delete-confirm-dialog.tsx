// components/notes/delete-confirm-dialog.tsx
// 노트 삭제 확인 다이얼로그 - 노트 삭제 전 사용자 확인을 받는 모달
// 실수 방지를 위한 노트 제목 표시 및 이중 확인 프로세스
// 관련 파일: components/notes/delete-note-button.tsx, lib/notes/actions.ts

'use client'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
    isOpen: boolean
    noteTitle: string
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
}

export function DeleteConfirmDialog({
    isOpen,
    noteTitle,
    onConfirm,
    onCancel,
    isLoading = false
}: DeleteConfirmDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>노트 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>&ldquo;{noteTitle}&rdquo;</strong>을(를) 정말 삭제하시겠습니까?
                    </AlertDialogDescription>
                    <div className="text-red-600 text-sm mt-2">
                        삭제된 노트는 복구할 수 없습니다.
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel 
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                삭제 중...
                            </>
                        ) : (
                            '삭제'
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
