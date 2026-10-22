import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  
  return Response.json({
    status: "ok",
    database: "connected",
    
  })
}
