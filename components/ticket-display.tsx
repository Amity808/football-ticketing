"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, Share2, CheckCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"

interface Ticket {
  id: string
  customerName: string
  date: string
  timeSlot: string
  status: string
  createdAt: string
}

interface TicketDisplayProps {
  ticket: Ticket
}

export function TicketDisplay({ ticket }: TicketDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadTicket = async () => {
    setIsDownloading(true)
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
    ctx.strokeStyle = "#22c55e"
    ctx.lineWidth = 4
    ctx.strokeRect(10, 10, 380, 580)

    // Draw header
    ctx.fillStyle = "#22c55e"
    ctx.fillRect(10, 10, 380, 80)

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.fillText("⚽ FOOTBALL CENTER", 200, 40)
    ctx.fillText("ENTRY TICKET", 200, 70)

    // Draw ticket details
    ctx.fillStyle = "#000000"
    ctx.font = "18px Arial"
    ctx.textAlign = "left"
    ctx.fillText(`Name: ${ticket.customerName}`, 30, 140)
    ctx.fillText(`Date: ${ticket.date}`, 30, 170)
    ctx.fillText(`Time: ${ticket.timeSlot}`, 30, 200)
    ctx.fillText(`Ticket ID: ${ticket.id}`, 30, 230)

    // Create download link
    const link = document.createElement("a")
    link.download = `football-ticket-${ticket.id}.png`
    link.href = canvas.toDataURL()
    link.click()

    setIsDownloading(false)
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Football Center Ticket",
          text: `My football booking for ${ticket.date} at ${ticket.timeSlot}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Ticket is Ready! 🎉</h1>
        <p className="text-gray-600">Show this ticket at the venue entrance</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardTitle className="text-center text-xl">⚽ FOOTBALL CENTER</CardTitle>
          <p className="text-center text-green-100">ENTRY TICKET</p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Name:</span>
              <span className="font-semibold">{ticket.customerName}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Date:</span>
              <span className="font-semibold">{ticket.date}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Time:</span>
              <span className="font-semibold">{ticket.timeSlot}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Status:</span>
              <Badge variant={ticket.status === "active" ? "default" : "secondary"}>
                {ticket.status === "active" ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  "Used"
                )}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Ticket ID</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded">{ticket.id}</p>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border">
              <QRCodeSVG
                value={JSON.stringify({
                  id: ticket.id,
                  name: ticket.customerName,
                  date: ticket.date,
                  time: ticket.timeSlot,
                  status: ticket.status,
                })}
                size={150}
                level="M"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={downloadTicket}
              disabled={isDownloading}
              className="w-full bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>

            <Button variant="outline" onClick={shareTicket} className="w-full bg-transparent">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-2">
        <Link href="/">
          <Button variant="ghost">Book Another Slot</Button>
        </Link>
        <Link href="/admin">
          <Button variant="link" size="sm">
            Admin Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
