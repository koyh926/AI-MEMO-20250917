// app/ai-test/page.tsx
// AI 기능 테스트 페이지
// 스토리 4.1 구현 완료 후 Gemini API 기능들을 웹에서 테스트할 수 있는 페이지
// 관련 파일: app/api/ai/test/route.ts, lib/ai/index.ts

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/ui/back-button'

interface TestResult {
  success: boolean
  result?: string
  summary?: string
  tags?: string[]
  duration?: number
  error?: string
  timestamp?: string
}

export default function AITestPage() {
  const [customPrompt, setCustomPrompt] = useState('')
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  const runTest = async (testType: string, customData?: unknown) => {
    setIsLoading(prev => ({ ...prev, [testType]: true }))
    
    try {
      let response
      
      if (testType === 'custom' && customData) {
        response = await fetch('/api/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customData)
        })
      } else {
        response = await fetch(`/api/ai/test?type=${testType}`)
      }
      
      const result = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        [testType]: result
      }))
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testType]: {
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, [testType]: false }))
    }
  }

  const runCustomTest = () => {
    if (!customPrompt.trim()) return
    
    runTest('custom', {
      prompt: customPrompt,
      options: {
        maxTokens: 200,
        temperature: 0.7
      }
    })
  }

  const testSummarize = async () => {
    setIsLoading(prev => ({ ...prev, summarize: true }))
    
    const testContent = `오늘 팀 회의에서 다음과 같은 내용들이 논의되었다:

1. 새로운 프로젝트 일정 계획 - 다음 달부터 본격 시작
2. 팀원 역할 분담 및 책임 영역 설정
3. 예산 승인 요청 및 비용 계획 수립
4. 고객 피드백 반영 방안 검토
5. 다음 회의 일정: 금요일 오후 2시

중요한 결정사항으로는 프로젝트 매니저를 김철수님이 담당하기로 했고, 전체 예산은 500만원으로 확정했다. 또한 고객 요구사항 변경에 대한 대응 프로세스도 새롭게 정립하기로 했다.`

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: testContent })
      })
      
      const result = await response.json()
      
      console.log('요약 API 응답:', result) // 디버깅용 로그
      
      setTestResults(prev => ({
        ...prev,
        summarize: result
      }))
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        summarize: {
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, summarize: false }))
    }
  }

  const testTags = async () => {
    setIsLoading(prev => ({ ...prev, tags: true }))
    
    const testData = {
      title: '점심 메뉴 아이디어',
      content: `점심 메뉴 아이디어 정리:
- 김치찌개 + 계란후라이
- 불고기 덮밥
- 치킨 샐러드
- 파스타 알리오올리오
- 된장찌개 + 생선구이

내일 마트에서 재료 구매 예정: 김치, 불고기용 소고기, 닭가슴살, 파스타면, 마늘 등등`
    }

    try {
      const response = await fetch('/api/ai/generate-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })
      
      const result = await response.json()
      
      setTestResults(prev => ({
        ...prev,
        tags: result
      }))
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        tags: {
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        }
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, tags: false }))
    }
  }

  const renderResult = (testType: string, result: TestResult) => {
    if (!result) return null

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">
            {testType === 'health' && '헬스체크 결과'}
            {testType === 'basic' && '기본 텍스트 생성 결과'}
            {testType === 'full' && '전체 테스트 결과'}
            {testType === 'custom' && '커스텀 테스트 결과'}
            {testType === 'summarize' && '요약 결과'}
            {testType === 'tags' && '태그 생성 결과'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <div className="space-y-2">
              {result.result && (
                <div>
                  <Label className="text-sm font-medium">생성된 텍스트:</Label>
                  <div className="bg-gray-50 p-3 rounded-md mt-1">
                    {result.result}
                  </div>
                </div>
              )}
              {result.summary && (
                <div>
                  <Label className="text-sm font-medium">요약:</Label>
                  <div className="bg-gray-50 p-3 rounded-md mt-1">
                    {result.summary}
                  </div>
                </div>
              )}
              {result.tags && (
                <div>
                  <Label className="text-sm font-medium">생성된 태그:</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {result.tags.map((tag: string, index: number) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.duration && (
                <div className="text-sm text-gray-600">
                  응답시간: {result.duration}ms
                </div>
              )}
              {result.timestamp && (
                <div className="text-xs text-gray-500">
                  테스트 시간: {new Date(result.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600 bg-red-50 p-3 rounded-md">
              에러: {result.error}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 네비게이션 헤더 */}
      <div className="mb-6">
        <BackButton 
          href="/" 
          showHomeLink={true}
        >
          대시보드로
        </BackButton>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI 기능 테스트</h1>
        <p className="text-muted-foreground">
          스토리 4.1에서 구현한 Gemini API 기능들을 테스트해보세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 기본 테스트들 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 테스트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => runTest('health')} 
              disabled={isLoading.health}
              className="w-full"
            >
              {isLoading.health ? '테스트 중...' : '헬스체크'}
            </Button>
            
            <Button 
              onClick={() => runTest('basic')} 
              disabled={isLoading.basic}
              className="w-full"
            >
              {isLoading.basic ? '테스트 중...' : '기본 텍스트 생성'}
            </Button>
            
            <Button 
              onClick={() => runTest('full')} 
              disabled={isLoading.full}
              className="w-full"
            >
              {isLoading.full ? '테스트 중...' : '전체 테스트 실행'}
            </Button>
          </CardContent>
        </Card>

        {/* AI 기능 테스트들 */}
        <Card>
          <CardHeader>
            <CardTitle>AI 기능 테스트</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testSummarize} 
              disabled={isLoading.summarize}
              className="w-full"
            >
              {isLoading.summarize ? '테스트 중...' : '노트 요약 테스트'}
            </Button>
            
            <Button 
              onClick={testTags} 
              disabled={isLoading.tags}
              className="w-full"
            >
              {isLoading.tags ? '테스트 중...' : '태그 생성 테스트'}
            </Button>
          </CardContent>
        </Card>

        {/* 커스텀 테스트 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>커스텀 프롬프트 테스트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-prompt">프롬프트 입력:</Label>
                <Textarea
                  id="custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="테스트하고 싶은 프롬프트를 입력하세요..."
                  rows={4}
                />
              </div>
              <Button 
                onClick={runCustomTest} 
                disabled={isLoading.custom || !customPrompt.trim()}
                className="w-full"
              >
                {isLoading.custom ? '테스트 중...' : '커스텀 테스트 실행'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결과 표시 */}
      <div className="mt-8 space-y-4">
        {Object.entries(testResults).map(([testType, result]) => 
          <div key={testType}>
            {renderResult(testType, result)}
          </div>
        )}
      </div>
    </div>
  )
}
