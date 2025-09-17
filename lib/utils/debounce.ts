// lib/utils/debounce.ts
// Debounce 유틸리티 함수 - 함수 호출을 지연시켜 성능 최적화
// 자동 저장 기능에서 사용되어 불필요한 API 호출 방지
// 관련 파일: lib/notes/hooks.ts, components/notes/note-editor.tsx

export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function (...args: Parameters<T>) {
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => func(...args), delay)
    }
}
