import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description } = body

  const todo = await prisma.todo.create({
    data: {
      title,
      description,
    },
  })

  return Response.json(todo)
}
