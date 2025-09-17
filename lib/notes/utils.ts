// lib/notes/utils.ts
// 노트 관련 유틸리티 함수들 - 텍스트 처리, 날짜 포매팅 등
// 노트 표시를 위한 공통 로직 구현
// 관련 파일: components/notes/note-card.tsx, app/notes/page.tsx

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표 추가
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text
    }
    return text.substring(0, maxLength).trim() + '...'
}

/**
 * 날짜를 상대적 시간으로 포매팅 (예: "2시간 전", "3일 전")
 */
export function formatRelativeTime(date: Date | string): string {
    const now = new Date()
    const targetDate = typeof date === 'string' ? new Date(date) : date
    const diffInMs = now.getTime() - targetDate.getTime()
    
    const minute = 60 * 1000
    const hour = minute * 60
    const day = hour * 24
    const week = day * 7
    const month = day * 30
    const year = day * 365
    
    if (diffInMs < minute) {
        return '방금 전'
    } else if (diffInMs < hour) {
        const minutes = Math.floor(diffInMs / minute)
        return `${minutes}분 전`
    } else if (diffInMs < day) {
        const hours = Math.floor(diffInMs / hour)
        return `${hours}시간 전`
    } else if (diffInMs < week) {
        const days = Math.floor(diffInMs / day)
        return `${days}일 전`
    } else if (diffInMs < month) {
        const weeks = Math.floor(diffInMs / week)
        return `${weeks}주 전`
    } else if (diffInMs < year) {
        const months = Math.floor(diffInMs / month)
        return `${months}개월 전`
    } else {
        const years = Math.floor(diffInMs / year)
        return `${years}년 전`
    }
}

/**
 * 노트 본문 미리보기 생성
 */
export function generateNotePreview(content: string, maxLength: number = 150): string {
    if (!content || content.trim() === '') {
        return '내용 없음'
    }
    
    // 줄바꿈을 공백으로 변경하고 연속된 공백 제거
    const cleanContent = content.replace(/\s+/g, ' ').trim()
    
    return truncateText(cleanContent, maxLength)
}
