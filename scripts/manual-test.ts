// scripts/manual-test.ts
// 실제 Gemini API 호출 테스트
// 다양한 프롬프트로 텍스트 생성 테스트

import { config } from 'dotenv'
import { generateText, getGeminiClient } from '../lib/ai'

// 환경변수 로드
config({ path: '.env.local' })

async function testTextGeneration() {
  console.log('🤖 Gemini API 실제 텍스트 생성 테스트 시작\n')
  
  const testCases = [
    {
      name: '간단한 인사',
      prompt: '안녕하세요! 간단하게 인사해주세요.',
      options: { maxTokens: 50 }
    },
    {
      name: '노트 요약 테스트',
      prompt: `다음 노트를 간단히 요약해주세요:

오늘 회의에서 논의된 내용:
1. 새로운 프로젝트 일정 - 다음 달부터 시작
2. 팀 구성원 역할 분담
3. 예산 승인 필요
4. 고객 피드백 반영 방안
5. 다음 회의는 금요일 오후 2시

중요한 결정사항: 프로젝트 매니저는 김철수님이 담당하기로 했고, 예산은 500만원으로 책정했다.`,
      options: { maxTokens: 200 }
    },
    {
      name: '태그 생성 테스트',
      prompt: `다음 노트에 적합한 태그 3-5개를 생성해주세요 (한글로, 콤마로 구분):

점심 메뉴 아이디어
- 김치찌개 + 계란후라이
- 불고기 덮밥
- 치킨 샐러드
- 파스타 알리오올리오
- 된장찌개 + 생선구이

내일 마트에서 재료 사야 함. 김치, 불고기용 소고기, 닭가슴살, 파스타면, 마늘 등등`,
      options: { maxTokens: 100 }
    },
    {
      name: '창의적 글쓰기',
      prompt: '봄날의 산책에 대한 짧은 시를 써주세요.',
      options: { maxTokens: 150, temperature: 0.8 }
    }
  ]

  for (const testCase of testCases) {
    try {
      console.log(`📝 테스트: ${testCase.name}`)
      console.log(`📥 입력: "${testCase.prompt.substring(0, 50)}${testCase.prompt.length > 50 ? '...' : ''}"`)
      
      const startTime = Date.now()
      const result = await generateText(testCase.prompt, testCase.options)
      const duration = Date.now() - startTime
      
      console.log(`📤 출력: "${result}"`)
      console.log(`⏱️  응답시간: ${duration}ms`)
      console.log(`📊 예상 토큰: 입력 ${Math.ceil(testCase.prompt.length / 4)}, 출력 ${Math.ceil(result.length / 4)}`)
      console.log('─'.repeat(80))
      console.log()
      
      // 다음 테스트까지 1초 대기 (레이트 리미트 방지)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`❌ 테스트 실패: ${testCase.name}`)
      console.error(`에러: ${error}`)
      console.log('─'.repeat(80))
      console.log()
    }
  }
}

async function testClientStatus() {
  console.log('🔍 Gemini 클라이언트 상태 확인\n')
  
  try {
    const client = getGeminiClient()
    const status = client.getStatus()
    const config = client.getConfig()
    
    console.log('📊 클라이언트 상태:')
    console.log(`   - 초기화됨: ${status.initialized}`)
    console.log(`   - 모델: ${status.model}`)
    console.log(`   - 최대 토큰: ${status.maxTokens}`)
    console.log(`   - 타임아웃: ${status.timeout}ms`)
    console.log()
    
    console.log('⚙️  설정 정보:')
    console.log(`   - API 키: ${config.apiKey.substring(0, 10)}...`)
    console.log(`   - 디버그 모드: ${config.debug}`)
    console.log(`   - 레이트 리미트: ${config.rateLimitPerMinute}/분`)
    console.log(`   - 온도: ${config.temperature}`)
    console.log()
    
  } catch (error) {
    console.error('❌ 클라이언트 상태 확인 실패:', error)
  }
}

async function main() {
  await testClientStatus()
  await testTextGeneration()
  
  console.log('🎉 모든 테스트 완료!')
}

main().catch(console.error)
