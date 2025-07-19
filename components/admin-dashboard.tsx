"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, QrCode, CheckCircle, Clock, Users } from "lucide-react"
import { getAllTickets, updateTicketStatus } from "@/app/actions"
import { QRScanner } from "@/components/qr-scanner"

interface Ticket {
  id: string
  customerName: string
  date: string
  timeSlot: string
  status: string
  createdAt: string
}

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      const data = await getAllTickets()
      setTickets(data)
    } catch (error) {
      console.error("Error loading tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicketStatus(ticketId, newStatus)
      setTickets(tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket)))
    } catch (error) {
      console.error("Error updating ticket:", error)
    }
  }

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeTickets = tickets.filter((t) => t.status === "active").length
  const usedTickets = tickets.filter((t) => t.status === "used").length
  const todayTickets = tickets.filter((t) => t.date === new Date().toISOString().split("T")[0]).length

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage football center bookings and tickets</p>
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
            <div className="text-2xl font-bold text-green-600">{activeTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{usedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{todayTickets}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
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
                    placeholder="Search by name or ticket ID..."
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
                      <TableHead>Status</TableHead>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.customerName}</TableCell>
                        <TableCell>{ticket.date}</TableCell>
                        <TableCell>{ticket.timeSlot}</TableCell>
                        <TableCell>
                          <Badge variant={ticket.status === "active" ? "default" : "secondary"}>{ticket.status}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          {ticket.status === "active" ? (
                            <Button size="sm" onClick={() => handleStatusUpdate(ticket.id, "used")}>
                              Mark as Used
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(ticket.id, "active")}>
                              Reactivate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanner">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code Scanner
              </CardTitle>
              <CardDescription>Scan customer tickets to verify and check them in</CardDescription>
            </CardHeader>
            <CardContent>
              <QRScanner
                onScan={(data) => {
                  try {
                    const ticketData = JSON.parse(data)
                    if (ticketData.id) {
                      handleStatusUpdate(ticketData.id, "used")
                    }
                  } catch (error) {
                    console.error("Invalid QR code:", error)
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
