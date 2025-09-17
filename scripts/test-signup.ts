// scripts/test-signup.ts
// 회원가입 기능 테스트 스크립트
// 이 파일은 회원가입 관련 기능들을 테스트합니다

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 환경 변수 로드
config({ path: '.env.local' })

// 테스트 환경 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 테스트 데이터
const testCases = [
    {
        name: '유효한 이메일과 비밀번호',
        email: 'test@example.com',
        password: 'Test123!@#',
        shouldPass: true
    },
    {
        name: '잘못된 이메일 형식',
        email: 'invalid-email',
        password: 'Test123!@#',
        shouldPass: false
    },
    {
        name: '짧은 비밀번호',
        email: 'test2@example.com',
        password: 'Test1',
        shouldPass: false
    },
    {
        name: '대문자가 없는 비밀번호',
        email: 'test3@example.com',
        password: 'test123!@#',
        shouldPass: false
    },
    {
        name: '소문자가 없는 비밀번호',
        email: 'test4@example.com',
        password: 'TEST123!@#',
        shouldPass: false
    },
    {
        name: '숫자가 없는 비밀번호',
        email: 'test5@example.com',
        password: 'TestPassword!@#',
        shouldPass: false
    }
]

// 이메일 형식 검증 함수
function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// 비밀번호 강도 검증 함수
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
        errors.push('비밀번호는 최소 8자 이상이어야 합니다.')
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        errors.push('비밀번호에 소문자가 포함되어야 합니다.')
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('비밀번호에 대문자가 포함되어야 합니다.')
    }
    
    if (!/(?=.*\d)/.test(password)) {
        errors.push('비밀번호에 숫자가 포함되어야 합니다.')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// 클라이언트 사이드 유효성 검사 테스트
async function testClientSideValidation() {
    console.log('\n🧪 클라이언트 사이드 유효성 검사 테스트')
    console.log('=' .repeat(50))
    
    for (const testCase of testCases) {
        console.log(`\n📝 테스트: ${testCase.name}`)
        console.log(`   이메일: ${testCase.email}`)
        console.log(`   비밀번호: ${testCase.password}`)
        
        // 이메일 검증
        const emailValid = validateEmail(testCase.email)
        console.log(`   이메일 검증: ${emailValid ? '✅' : '❌'}`)
        
        // 비밀번호 검증
        const passwordValidation = validatePassword(testCase.password)
        console.log(`   비밀번호 검증: ${passwordValidation.isValid ? '✅' : '❌'}`)
        
        if (!passwordValidation.isValid) {
            passwordValidation.errors.forEach(error => {
                console.log(`     - ${error}`)
            })
        }
        
        // 전체 검증 결과
        const overallValid = emailValid && passwordValidation.isValid
        const expectedResult = testCase.shouldPass ? '통과' : '실패'
        const actualResult = overallValid ? '통과' : '실패'
        
        console.log(`   예상 결과: ${expectedResult}`)
        console.log(`   실제 결과: ${actualResult}`)
        console.log(`   테스트: ${expectedResult === actualResult ? '✅' : '❌'}`)
    }
}

// Supabase 연결 테스트
async function testSupabaseConnection() {
    console.log('\n🔗 Supabase 연결 테스트')
    console.log('=' .repeat(50))
    
    try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
            console.log(`❌ Supabase 연결 실패: ${error.message}`)
            return false
        }
        
        console.log('✅ Supabase 연결 성공')
        console.log(`   현재 세션: ${data.session ? '활성' : '비활성'}`)
        return true
    } catch (error) {
        console.log(`❌ Supabase 연결 오류: ${error}`)
        return false
    }
}

// 회원가입 시뮬레이션 테스트 (실제 회원가입은 하지 않음)
async function testSignupSimulation() {
    console.log('\n📧 회원가입 시뮬레이션 테스트')
    console.log('=' .repeat(50))
    
    const testEmail = 'simulation-test@example.com'
    const testPassword = 'Test123!@#'
    
    console.log(`테스트 이메일: ${testEmail}`)
    console.log(`테스트 비밀번호: ${testPassword}`)
    
    // 실제 회원가입은 하지 않고 유효성 검사만 수행
    const emailValid = validateEmail(testEmail)
    const passwordValidation = validatePassword(testPassword)
    
    console.log(`이메일 검증: ${emailValid ? '✅' : '❌'}`)
    console.log(`비밀번호 검증: ${passwordValidation.isValid ? '✅' : '❌'}`)
    
    if (passwordValidation.isValid) {
        console.log('✅ 회원가입 시뮬레이션 성공 - 실제 회원가입 가능')
    } else {
        console.log('❌ 회원가입 시뮬레이션 실패 - 유효성 검사 통과하지 못함')
    }
}

// 메인 테스트 실행
async function runTests() {
    console.log('🚀 회원가입 기능 테스트 시작')
    console.log('=' .repeat(50))
    
    // Supabase 연결 테스트
    const isConnected = await testSupabaseConnection()
    if (!isConnected) {
        console.log('\n❌ Supabase 연결에 실패하여 테스트를 중단합니다.')
        return
    }
    
    // 클라이언트 사이드 유효성 검사 테스트
    await testClientSideValidation()
    
    // 회원가입 시뮬레이션 테스트
    await testSignupSimulation()
    
    console.log('\n🎉 모든 테스트 완료!')
    console.log('=' .repeat(50))
}

// 테스트 실행
runTests().catch(console.error)
