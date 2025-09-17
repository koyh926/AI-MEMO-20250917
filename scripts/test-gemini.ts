// scripts/test-gemini.ts
// Gemini API 연동 테스트 스크립트
// 환경변수 설정 후 실행하여 API 연결을 확인
// 실행: npx tsx scripts/test-gemini.ts

import { config } from 'dotenv'
import { runAllTests } from '../lib/ai'

// 환경변수 로드
config({ path: '.env.local' })

async function main() {
  console.log('🚀 Gemini API 연동 테스트 시작...\n')
  
  try {
    const testResults = await runAllTests()
    
    console.log('📊 테스트 결과:')
    console.log('================')
    
    // 헬스체크 결과
    console.log(`✅ 헬스체크: ${testResults.results.healthCheck.success ? '성공' : '실패'}`)
    if (testResults.results.healthCheck.healthy !== undefined) {
      console.log(`   - API 상태: ${testResults.results.healthCheck.healthy ? '정상' : '비정상'}`)
    }
    if (testResults.results.healthCheck.duration) {
      console.log(`   - 응답시간: ${testResults.results.healthCheck.duration}ms`)
    }
    if (testResults.results.healthCheck.error) {
      console.log(`   - 에러: ${testResults.results.healthCheck.error}`)
    }
    
    console.log()
    
    // 기본 텍스트 생성 결과
    console.log(`✅ 기본 텍스트 생성: ${testResults.results.basicGeneration.success ? '성공' : '실패'}`)
    if (testResults.results.basicGeneration.result) {
      console.log(`   - 생성된 텍스트: "${testResults.results.basicGeneration.result.substring(0, 100)}${testResults.results.basicGeneration.result.length > 100 ? '...' : ''}"`)
    }
    if (testResults.results.basicGeneration.duration) {
      console.log(`   - 응답시간: ${testResults.results.basicGeneration.duration}ms`)
    }
    if (testResults.results.basicGeneration.error) {
      console.log(`   - 에러: ${testResults.results.basicGeneration.error}`)
    }
    
    console.log()
    
    // 토큰 제한 테스트 결과
    console.log(`✅ 토큰 제한 테스트: ${testResults.results.tokenLimit.success ? '성공' : '실패'}`)
    if (testResults.results.tokenLimit.tokenCount) {
      console.log(`   - 테스트 토큰 수: ${testResults.results.tokenLimit.tokenCount}`)
    }
    if (testResults.results.tokenLimit.error) {
      console.log(`   - 에러: ${testResults.results.tokenLimit.error}`)
    }
    
    console.log()
    console.log('================')
    console.log(`🎯 전체 결과: ${testResults.overall ? '✅ 모든 테스트 성공!' : '❌ 일부 테스트 실패'}`)
    
    if (testResults.overall) {
      console.log('\n🎉 Gemini API 연동이 성공적으로 완료되었습니다!')
      console.log('이제 AI 기능을 사용할 수 있습니다.')
    } else {
      console.log('\n⚠️  일부 테스트가 실패했습니다.')
      console.log('환경변수 설정과 API 키를 다시 확인해주세요.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error)
    console.error('\n🔧 문제 해결 방법:')
    console.error('1. .env.local 파일에 GEMINI_API_KEY가 올바르게 설정되어 있는지 확인')
    console.error('2. API 키가 유효하고 권한이 있는지 확인')
    console.error('3. 네트워크 연결 상태 확인')
    process.exit(1)
  }
}

main()
