'use client'

import { useState } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { resendConfirmationEmail } from '@/lib/auth/actions'

export default function VerifyEmailPage() {
    const [email, setEmail] = useState('')
    const [isResending, setIsResending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleResendEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsResending(true)
        setMessage(null)

        try {
            const result = await resendConfirmationEmail(email)
            if (result.success) {
                setMessage({ type: 'success', text: result.message! })
            } else {
                setMessage({ type: 'error', text: result.error! })
            }
        } catch {
            setMessage({ type: 'error', text: '오류가 발생했습니다. 다시 시도해주세요.' })
        } finally {
            setIsResending(false)
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        이메일을 확인해주세요
                    </CardTitle>
                    <CardDescription className="text-center">
                        회원가입을 완료하기 위해 이메일 인증이 필요합니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600 text-center space-y-2">
                        <p>입력하신 이메일 주소로 인증 링크를 발송했습니다.</p>
                        <p>이메일의 링크를 클릭하여 계정을 활성화해주세요.</p>
                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-4">
                            <p className="text-yellow-700 text-xs">
                                <strong>💡 팁:</strong> 이메일이 오지 않는다면 스팸 메일함을 확인하거나, 
                                아래에서 이메일을 다시 입력하여 재발송해보세요.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                            이메일이 오지 않았나요?
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4">
                            <li>• 스팸/정크 메일함을 확인해보세요</li>
                            <li>• 이메일 주소가 정확한지 확인해보세요</li>
                            <li>• 몇 분 후에 다시 확인해보세요</li>
                        </ul>
                    </div>

                    {/* 이메일 재발송 폼 */}
                    <div className="pt-4 border-t">
                        <form onSubmit={handleResendEmail} className="space-y-3">
                            <div>
                                <Label htmlFor="email" className="text-sm font-medium">
                                    이메일 재발송
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="이메일 주소를 입력하세요"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            
                            {message && (
                                <div className={`p-3 rounded-md text-sm ${
                                    message.type === 'success' 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        {message.type === 'success' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <Mail className="w-4 h-4" />
                                        )}
                                        {message.text}
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                disabled={isResending || !email.trim()}
                                className="w-full"
                            >
                                {isResending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        재발송 중...
                                    </>
                                ) : (
                                    '인증 이메일 재발송'
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/signin">로그인 페이지로 돌아가기</Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/signup">다른 이메일로 가입하기</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// metadata는 클라이언트 컴포넌트에서 export할 수 없으므로 제거
// 대신 페이지 내에서 동적으로 설정
