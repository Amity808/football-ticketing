"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, Share2, Printer } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import type { Ticket } from "../actions"
import { formatNairaSimple } from "@/lib/utils/currency"

interface TicketDisplayProps {
  ticket: Ticket
  onBack: () => void
}

export default function TicketDisplay({ ticket, onBack }: TicketDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const downloadTicket = async () => {
    setIsDownloading(true)

    try {
      // Create a canvas to render the ticket
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      canvas.width = 400
      canvas.height = 600

      // Draw ticket background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, 400, 600)

      // Draw border
      ctx.strokeStyle = "#E02020" // Crescendo Red
      ctx.lineWidth = 4
      ctx.strokeRect(10, 10, 380, 580)

      // Draw header
      ctx.fillStyle = "#E02020" // Crescendo Red
      ctx.fillRect(10, 10, 380, 80)

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Crescendo Sport Lounge", 200, 40)
      ctx.fillText("ENTRY TICKET", 200, 70)

      // Draw ticket details
      ctx.fillStyle = "#000000"
      ctx.font = "18px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Name: ${ticket.user_name}`, 30, 140)

      if (ticket.time_slot) {
        ctx.fillText(`Date: ${formatDate(ticket.time_slot.date)}`, 30, 170)
        ctx.fillText(`Time: ${formatTime(ticket.time_slot.time)}`, 30, 200)
        ctx.fillText(`People: ${ticket.number_of_people}`, 30, 230)
        ctx.fillText(`Base Price: ${formatNairaSimple(ticket.time_slot.price)}`, 30, 260)
        if (ticket.discount_applied > 0) {
          ctx.fillText(`Discount: -${formatNairaSimple(ticket.discount_applied)}`, 30, 290)
        }
        ctx.fillText(
          `Total Paid: ${formatNairaSimple(ticket.time_slot.price * ticket.number_of_people - ticket.discount_applied)}`,
          30,
          320,
        )
      }

      ctx.fillText(`Ticket #: ${ticket.ticket_number}`, 30, 350)
      ctx.fillText(`Status: ${ticket.status.toUpperCase()}`, 30, 380)

      // Create download link
      const link = document.createElement("a")
      link.download = `crescendo-ticket-${ticket.ticket_number}.png`
      link.href = canvas.toDataURL()
      link.click()
    } catch (error) {
      console.error("Error downloading ticket:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const shareTicket = async () => {
    if (navigator.share && ticket.time_slot) {
      try {
        await navigator.share({
          title: "Crescendo Sport Lounge Ticket",
          text: `My booking for ${formatDate(ticket.time_slot.date)} at ${formatTime(ticket.time_slot.time)} for ${ticket.number_of_people} people.`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    }
  }

  const printTicket = () => {
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
        @page {
          size: 58mm auto;
          margin: 0;
        }
        html, body { width: 58mm; }
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #000;
          font-size: 11px;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      
      body {
        font-family: Arial, sans-serif;
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
        background: white;
      }
      
      .ticket-container {
        border: 3px solid #E02020; /* Crescendo Red */
        border-radius: 8px;
        overflow: hidden;
        background: white;
        width: 100%;
        max-width: 58mm;
        margin: 0 auto;
      }
      
      .ticket-header {
        background: linear-gradient(to right, #E02020, #B31A1A); /* Crescendo Red gradient */
        color: white;
        text-align: center;
        padding: 20px;
      }
      
      .ticket-header h1 {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }
      
      .ticket-header p {
        margin: 5px 0 0 0;
        opacity: 0.9;
      }
      
      .ticket-content {
        padding: 16px;
      }
      
      .ticket-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .ticket-row:last-child {
        border-bottom: none;
      }
      
      .ticket-label {
        font-weight: 600;
        color: #6b7280;
      }
      
      .ticket-value {
        font-weight: bold;
        color: #000;
      }
      
      .ticket-number {
        text-align: center;
        margin: 20px 0;
        padding: 15px;
        background: #f9fafb;
        border-radius: 6px;
      }
      
      .ticket-number-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 5px;
      }
      
      .ticket-number-value {
        font-family: 'Courier New', monospace;
        font-size: 16px;
        font-weight: bold;
        letter-spacing: 2px;
      }
      
      .qr-section {
        text-align: center;
        margin: 20px 0;
        padding: 12px;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
      }
      
      .qr-placeholder {
        width: 32mm;
        height: 32mm;
        margin: 0 auto 10px;
        border: 2px solid #e5e7eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #6b7280;
        background: #f9fafb;
      }
      
      .instructions {
        margin-top: 20px;
        padding: 12px;
        background: #fef3c7;
        border-radius: 6px;
        border-left: 4px solid #f59e0b;
      }
      
      .instructions h3 {
        margin: 0 0 10px 0;
        color: #92400e;
        font-size: 14px;
      }
      
      .instructions ul {
        margin: 0;
        padding-left: 20px;
        color: #92400e;
      }
      
      .instructions li {
        margin-bottom: 5px;
      }
      
      .footer {
        text-align: center;
        margin-top: 20px;
        padding-top: 12px;
        border-top: 2px solid #e5e7eb;
        font-size: 10px;
        color: #6b7280;
      }
      
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: bold;
        text-transform: uppercase;
      }
      
      .status-active {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #22c55e;
      }
      
      .status-used {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #9ca3af;
      }
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
        
        <div class="ticket-row">
          <span class="ticket-label">Status:</span>
          <span class="status-badge ${ticket.status === "active" ? "status-active" : "status-used"}">
            ${ticket.status.toUpperCase()}
          </span>
        </div>
        
        <div class="ticket-number">
          <div class="ticket-number-label">Ticket Number</div>
          <div class="ticket-number-value">${ticket.ticket_number}</div>
        </div>
        
        <div class="qr-section">
          <div class="qr-placeholder">
            QR CODE<br/>
            (Scan at venue)
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">
            Show this ticket at the entrance
          </div>
        </div>
        
        <div class="instructions">
          <h3>Important Instructions:</h3>
          <ul>
            <li>Arrive 15 minutes before your scheduled time</li>
            <li>Bring appropriate sports attire and footwear</li>
            <li>Present this ticket at the entrance</li>
            <li>Ticket is valid only for the specified date and time</li>
            <li>No refunds for missed sessions</li>
          </ul>
        </div>
        
        <div class="footer">
          <p><strong>Crescendo Sport Lounge</strong></p>
          <p>For inquiries: info@crescendosportlounge.com | (555) 123-4567</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  </body>
  </html>
`

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Use a small timeout to ensure the content is rendered before printing
    // This often helps with inconsistent print behavior across browsers
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 100) // 100ms delay
    }
  }

  const qrData = JSON.stringify({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    userName: ticket.user_name,
    date: ticket.time_slot?.date,
    time: ticket.time_slot?.time,
    status: ticket.status,
    people: ticket.number_of_people,
    discount: ticket.discount_applied,
  })

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-crescendo-dark">Ticket Generated! 🎉</h1>
          <p className="text-gray-600">Show this at the venue entrance</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-crescendo-red to-crescendo-red-dark text-white">
          <CardTitle className="text-center text-xl">Crescendo Sport Lounge</CardTitle>
          <p className="text-center text-white/80">ENTRY TICKET</p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Name:</span>
              <span className="font-semibold">{ticket.user_name}</span>
            </div>

            {ticket.time_slot && (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Date:</span>
                  <span className="font-semibold">{formatDate(ticket.time_slot.date)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Time:</span>
                  <span className="font-semibold">{formatTime(ticket.time_slot.time)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">People:</span>
                  <span className="font-semibold">{ticket.number_of_people}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Base Price (per person):</span>
                  <span className="font-semibold">{formatNairaSimple(ticket.time_slot.price)}</span>
                </div>

                {ticket.discount_applied > 0 && (
                  <div className="flex justify-between text-crescendo-red">
                    <span className="font-medium">Discount Applied:</span>
                    <span className="font-semibold">- {formatNairaSimple(ticket.discount_applied)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold">
                  <span className="font-medium text-gray-700">Total Paid:</span>
                  <span className="text-crescendo-red">
                    {formatNairaSimple(ticket.time_slot.price * ticket.number_of_people - ticket.discount_applied)}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Status:</span>
              <Badge variant={ticket.status === "active" ? "default" : "secondary"}>
                {ticket.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Ticket Number</p>
              <p className="font-mono text-lg font-bold">{ticket.ticket_number}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <QRCodeSVG value={qrData} size={150} level="M" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={downloadTicket} disabled={isDownloading}>
              <Download className="w-4 h-4 mr-1" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>

            <Button variant="outline" onClick={printTicket}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Button>

            <Button variant="outline" onClick={shareTicket}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
