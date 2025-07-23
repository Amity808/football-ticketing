"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, Clock, CheckCircle, ArrowLeft, Printer, DollarSign } from "lucide-react"
import { markTicketAsUsed, type Ticket } from "../actions"
import Link from "next/link"
import { formatNairaSimple } from "@/lib/utils/currency"
import Image from "next/image"

interface AdminDashboardProps {
  initialTickets: Ticket[]
}

export default function AdminDashboard({ initialTickets }: AdminDashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [searchTerm, setSearchTerm] = useState("")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleMarkAsUsed = async (ticketId: string) => {
    setIsUpdating(ticketId)
    const result = await markTicketAsUsed(ticketId)

    if (result.success) {
      setTickets(tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: "used" as const } : ticket)))
    }

    setIsUpdating(null)
  }

  const printTicket = (ticket: Ticket) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups for printing.") // Inform user about pop-up blocker
      return
    }

    const printContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Crescendo Sport Lounge Ticket - ${ticket.ticket_number}</title>
    <style>
      @media print {
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; color: #000; }
      }
      body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
      .ticket-container { border: 3px solid #E02020; border-radius: 8px; overflow: hidden; }
      .ticket-header { background: #E02020; color: white; text-align: center; padding: 20px; }
      .ticket-header h1 { margin: 0; font-size: 24px; }
      .ticket-content { padding: 30px; }
      .ticket-row { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb; }
      .ticket-label { font-weight: 600; color: #6b7280; }
      .ticket-value { font-weight: bold; }
      .ticket-number { text-align: center; margin: 20px 0; padding: 15px; background: #f9fafb; }
      .ticket-number-value { font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
      .qr-section { text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #d1d5db; }
      .qr-placeholder { width: 120px; height: 120px; margin: 0 auto; border: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="ticket-container">
      <div class="ticket-header">
        <h1>Crescendo Sport Lounge</h1>
        <p>ENTRY TICKET</p>
      </div>
      <div class="ticket-content">
        <div class="ticket-row">
          <span class="ticket-label">Name:</span>
          <span class="ticket-value">${ticket.user_name}</span>
        </div>
        ${ticket.time_slot
        ? `
          <div class="ticket-row">
            <span class="ticket-label">Date:</span>
            <span class="ticket-value">${formatDate(ticket.time_slot.date)}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">Time:</span>
            <span class="ticket-value">${formatTime(ticket.time_slot.time)}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">People:</span>
            <span class="ticket-value">${ticket.number_of_people}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-label">Base Price:</span>
            <span class="ticket-value">${formatNairaSimple(ticket.time_slot.price)}</span>
          </div>
          ${ticket.discount_applied > 0
          ? `
          <div class="ticket-row">
            <span class="ticket-label">Discount:</span>
            <span class="ticket-value">- ${formatNairaSimple(ticket.discount_applied)}</span>
          </div>
          `
          : ""
        }
          <div class="ticket-row">
            <span class="ticket-label">Total Paid:</span>
            <span class="ticket-value">${formatNairaSimple(ticket.time_slot.price * ticket.number_of_people - ticket.discount_applied)}</span>
          </div>
        `
        : ""
      }
        <div class="ticket-number">
          <div class="ticket-number-value">${ticket.ticket_number}</div>
        </div>
        <div class="qr-section">
          <div class="qr-placeholder">QR CODE</div>
        </div>
      </div>
    </div>
  </body>
  </html>
`

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 10000) // 8000ms delay
    }
  }

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeTickets = tickets.filter((t) => t.status === "active").length
  const usedTickets = tickets.filter((t) => t.status === "used").length
  const totalRevenue = tickets.reduce((sum, ticket) => {
    if (!ticket.time_slot) return sum
    const ticketTotal = (ticket.time_slot.price * ticket.number_of_people) - ticket.discount_applied
    return sum + ticketTotal
  }, 0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Image src="/crescendo-logo.png" alt="Crescendo Sport Lounge Logo" width={150} height={75} className="mb-2" />
          <h1 className="text-3xl font-bold text-crescendo-dark mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage Crescendo Sport Lounge bookings and tickets</p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-crescendo-red">{activeTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-crescendo-orange">{usedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-crescendo-dark">{formatNairaSimple(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Management</CardTitle>
          <CardDescription>View and manage all football center bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ticket number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>People</TableHead>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.user_name}</TableCell>
                    <TableCell>{ticket.time_slot ? formatDate(ticket.time_slot.date) : "N/A"}</TableCell>
                    <TableCell>{ticket.time_slot ? formatTime(ticket.time_slot.time) : "N/A"}</TableCell>
                    <TableCell>{ticket.number_of_people}</TableCell>
                    <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === "active" ? "default" : "secondary"}>
                        {ticket.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.payment_status === "paid" ? "default" : "secondary"}>
                        {ticket.payment_status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {ticket.status === "active" ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsUsed(ticket.id)}
                            disabled={isUpdating === ticket.id}
                          >
                            {isUpdating === ticket.id ? "Updating..." : "Mark as Used"}
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">Used</span>
                        )}
                        <Button size="sm" variant="outline" onClick={() => printTicket(ticket)}>
                          <Printer className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
