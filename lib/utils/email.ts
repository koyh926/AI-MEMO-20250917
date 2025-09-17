// lib/utils/email.ts
// 이메일 주소 마스킹 유틸리티 - 사용자 프라이버시 보호
// @ 이후 도메인 부분을 마스킹하여 개인정보를 보호
// 관련 파일: app/page.tsx

/**
 * 이메일 주소의 도메인 부분을 마스킹합니다
 * @param email - 마스킹할 이메일 주소
 * @returns 마스킹된 이메일 주소 (예: user@****)
 */
export function maskEmail(email: string): string {
    if (!email || typeof email !== 'string') {
        return email
    }

    const atIndex = email.indexOf('@')
    
    // @ 기호가 없으면 원본 반환
    if (atIndex === -1) {
        return email
    }

    const username = email.substring(0, atIndex)
    return `${username}@****`
}

/**
 * 사용자 표시용 이메일 마스킹 (더 친화적인 형태)
 * @param email - 마스킹할 이메일 주소
 * @returns 마스킹된 이메일 주소 (예: user@••••)
 */
export function maskEmailFriendly(email: string): string {
    if (!email || typeof email !== 'string') {
        return email
    }

    const atIndex = email.indexOf('@')
    
    // @ 기호가 없으면 원본 반환
    if (atIndex === -1) {
        return email
    }

    const username = email.substring(0, atIndex)
    return `${username}@••••`
}
