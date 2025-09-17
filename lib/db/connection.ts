// lib/db/connection.ts
// Drizzle ORM 데이터베이스 연결 설정 - PostgreSQL과 연결하여 쿼리 실행
// Supabase PostgreSQL 데이터베이스와 직접 연결하여 서버 사이드에서 사용
// 관련 파일: lib/db/schema/notes.ts, lib/notes/queries.ts, lib/notes/actions.ts

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/notes'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)

export const db = drizzle(client, { schema })
