"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, Loader2 } from "lucide-react"
import { verifyPaymentAndCreateTicket } from "@/app/actions"
import TicketDisplay from "@/app/components/TicketDisplay"
import type { Ticket } from "@/app/actions"

export default function PaymentVerificationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const reference = searchParams.get("reference")

    if (!reference) {
      setStatus("failed")
      setError("Payment reference not found")
      return
    }

    verifyPayment(reference)
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const result = await verifyPaymentAndCreateTicket(reference)

      if (result.success && result.data) {
        setTicket(result.data)
        setStatus("success")
      } else {
        setStatus("failed")
        setError(result.error || "Payment verification failed")
      }
    } catch (error) {
      setStatus("failed")
      setError("An error occurred during verification")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-gray-600">Please wait while we confirm your payment</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "success" && ticket) {
    return (
      <div className="min-h-screen bg-green-50 py-8">
        <div className="container mx-auto px-4">
          <TicketDisplay ticket={ticket} onBack={() => router.push("/")} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-red-600" />
            Payment Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/")} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/contact")} className="w-full">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
