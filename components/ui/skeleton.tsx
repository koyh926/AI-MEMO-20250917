// components/ui/skeleton.tsx
// 로딩 스켈레톤 UI 컴포넌트 - 콘텐츠 로딩 중 표시
// shadcn/ui 기반 스켈레톤 컴포넌트
// 관련 파일: app/notes/loading.tsx, components/notes/note-card.tsx

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
