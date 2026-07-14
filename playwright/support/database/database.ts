import 'dotenv/config'
import pg from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import { Database } from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL não foi definida no .env')
}

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
  }),
})

export const db = new Kysely<Database>({
  dialect,
})
