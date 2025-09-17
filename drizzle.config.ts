// drizzle.config.ts
// Drizzle Kit 설정 파일 - 데이터베이스 마이그레이션 및 스키마 생성을 위한 설정
// Supabase PostgreSQL과 연결하여 스키마 변경사항을 관리
// 관련 파일: lib/db/schema/*.ts, drizzle/ 마이그레이션 폴더

import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({path: '.env.local'})

export default defineConfig({
    out: './drizzle',
    schema: './lib/db/schema/*.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!
    }
})
