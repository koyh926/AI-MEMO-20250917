// components/notes/highlight-text.tsx
// 텍스트 하이라이트 컴포넌트 - 검색어를 텍스트에서 강조 표시
// 대소문자 구분 없는 검색어 하이라이트 기능
// 관련 파일: components/notes/note-card.tsx, components/notes/notes-list.tsx

'use client'

interface HighlightTextProps {
    text: string
    highlight: string
    className?: string
}

export function HighlightText({ text, highlight, className }: HighlightTextProps) {
    // 하이라이트할 검색어가 없으면 원본 텍스트 반환
    if (!highlight.trim()) {
        return <span className={className}>{text}</span>
    }

    try {
        // 특수 문자 이스케이프 처리
        const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedHighlight})`, 'gi')
        const parts = text.split(regex)

        return (
            <span className={className}>
                {parts.map((part, index) => {
                    // 검색어와 일치하는 부분은 하이라이트
                    if (regex.test(part)) {
                        return (
                            <mark 
                                key={index} 
                                className="bg-yellow-200 text-yellow-900 px-0.5 rounded"
                            >
                                {part}
                            </mark>
                        )
                    }
                    return part
                })}
            </span>
        )
    } catch (error) {
        // 정규식 에러 시 원본 텍스트 반환
        console.warn('하이라이트 처리 중 오류:', error)
        return <span className={className}>{text}</span>
    }
}
