import { getAllTickets } from "../actions"
import AdminDashboard from "../components/AdminDashboard"

export default async function AdminPage() {
  const ticketsResult = await getAllTickets()

  if (!ticketsResult.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Tickets</h1>
          <p className="text-gray-600">{ticketsResult.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboard initialTickets={ticketsResult.data} />
    </div>
  )
}
