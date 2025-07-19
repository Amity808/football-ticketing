import { getTicket } from "@/app/actions"
import { TicketDisplay } from "@/components/ticket-display"
import { notFound } from "next/navigation"

interface TicketPageProps {
  params: Promise<{ id: string }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params
  const ticket = await getTicket(id)

  if (!ticket) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <TicketDisplay ticket={ticket} />
      </div>
    </div>
  )
}
