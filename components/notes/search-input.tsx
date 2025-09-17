// components/notes/search-input.tsx
// 노트 검색 입력 필드 컴포넌트 - 실시간 검색 및 URL 상태 관리
// debounce를 사용한 성능 최적화 및 반응형 디자인
// 관련 파일: app/notes/page.tsx, lib/notes/queries.ts

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
    placeholder?: string
    className?: string
}

export function SearchInput({ 
    placeholder = '노트 검색...', 
    className 
}: SearchInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchValue, setSearchValue] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // URL에서 초기 검색어 가져오기
    useEffect(() => {
        const initialSearch = searchParams.get('search') || ''
        setSearchValue(initialSearch)
    }, [searchParams])

    // debounce를 위한 ref
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // 검색 함수
    const performSearch = useCallback((query: string) => {
        const params = new URLSearchParams(searchParams.toString())
        
        if (query.trim()) {
            params.set('search', query.trim())
            params.set('page', '1') // 검색 시 첫 페이지로 이동
        } else {
            params.delete('search')
            params.set('page', '1')
        }
        
        // URL 업데이트
        router.replace(`/notes?${params.toString()}`)
        setIsSearching(false)
    }, [router, searchParams])

    // debounce된 검색 함수
    const debouncedSearch = useCallback((query: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
            performSearch(query)
        }, 300)
    }, [performSearch])

    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        setIsSearching(true)
        debouncedSearch(value)
    }

    const clearSearch = () => {
        setSearchValue('')
        const params = new URLSearchParams(searchParams.toString())
        params.delete('search')
        params.set('page', '1')
        router.replace(`/notes?${params.toString()}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // ESC 키로 검색어 지우기
        if (e.key === 'Escape') {
            clearSearch()
        }
    }

    return (
        <div className={`relative ${className || ''}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    type="text"
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="pl-10 pr-10"
                />
                {searchValue && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSearch}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                )}
            </div>
            
            {/* 검색 힌트 */}
            {isSearching && searchValue && (
                <div className="absolute top-full left-0 right-0 mt-1 text-xs text-gray-500">
                    검색 중...
                </div>
            )}
        </div>
    )
}
