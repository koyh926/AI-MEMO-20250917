// components/ui/back-button.tsx
// 뒤로가기 버튼 컴포넌트 - 이전 페이지로 돌아가는 네비게이션 버튼
// 노트 상세 페이지에서 목록으로 돌아갈 때 사용
// 관련 파일: components/notes/note-editor.tsx, app/notes/[id]/page.tsx

'use client'

import { ArrowLeft, Home } from 'lucide-react'
import { Button } from './button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BackButtonProps {
    href?: string
    children?: React.ReactNode
    variant?: 'default' | 'ghost' | 'outline'
    className?: string
    showHomeLink?: boolean
}

export function BackButton({ 
    href = '/notes', 
    children = '노트 목록으로',
    variant = 'ghost',
    className,
    showHomeLink = false
}: BackButtonProps) {
    const router = useRouter()

    const handleClick = () => {
        if (href) {
            router.push(href)
        } else {
            router.back()
        }
    }

    if (showHomeLink) {
        return (
            <div className="flex items-center gap-2">
                <Link href="/">
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        홈
                    </Button>
                </Link>
                <span className="text-muted-foreground">/</span>
                <Button
                    variant={variant}
                    onClick={handleClick}
                    className={`flex items-center gap-2 ${className || ''}`}
                >
                    <ArrowLeft className="w-4 h-4" />
                    {children}
                </Button>
            </div>
        )
    }

    return (
        <Button
            variant={variant}
            onClick={handleClick}
            className={`flex items-center gap-2 ${className || ''}`}
        >
            <ArrowLeft className="w-4 h-4" />
            {children}
        </Button>
    )
}
