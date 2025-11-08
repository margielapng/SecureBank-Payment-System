import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB

if (!uri) {
  throw new Error("MONGODB_URI is not set. Add it to your .env.local file.")
}
if (!dbName) {
  throw new Error("MONGODB_DB is not set. Add it to your .env.local file.")
}

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient
  const client = new MongoClient(uri as string)
  await client.connect()
  cachedClient = client
  return client
}

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb
  const client = await getClient()
  const db = client.db(dbName as string)
  cachedDb = db
  return db
}
