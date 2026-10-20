import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  await prisma.todo.count()
  const [result] = await prisma.$queryRaw<{ database_time: string }[]>`
    SELECT NOW()::text AS database_time
  `

  return Response.json({
    status: "ok",
    database: "connected",
    todoModel: "available",
    databaseTime: result.database_time,
  })
}
