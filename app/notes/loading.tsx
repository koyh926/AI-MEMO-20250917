// app/notes/loading.tsx
// 노트 목록 로딩 페이지 - 노트 목록 페이지 로딩 중 표시되는 스켈레톤 UI
// Next.js App Router의 loading.tsx 컨벤션 활용
// 관련 파일: app/notes/page.tsx, components/ui/skeleton.tsx

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function NotesLoading() {
    return (
        <div className="container mx-auto py-8 px-4">
            {/* 헤더 스켈레톤 */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Skeleton className="h-9 w-32 mb-2" />
                    <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* 정렬 드롭다운 스켈레톤 */}
            <div className="flex justify-end mb-4">
                <Skeleton className="h-10 w-32" />
            </div>

            {/* 노트 카드 스켈레톤 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full mb-2" />
                            <Skeleton className="h-4 w-4/5 mb-2" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
