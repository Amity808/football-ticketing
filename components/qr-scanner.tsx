"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, CheckCircle, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [manualInput, setManualInput] = useState("")
  const [scanResult, setScanResult] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const handleManualScan = () => {
    if (!manualInput.trim()) return

    try {
      // Try to parse as JSON (QR code data)
      const data = JSON.parse(manualInput)
      if (data.id && data.name) {
        onScan(manualInput)
        setScanResult({
          type: "success",
          message: `Ticket verified for ${data.name}`,
        })
        setManualInput("")
      } else {
        throw new Error("Invalid ticket format")
      }
    } catch (error) {
      // If not JSON, treat as ticket ID
      onScan(manualInput)
      setScanResult({
        type: "success",
        message: "Ticket processed",
      })
      setManualInput("")
    }

    // Clear result after 3 seconds
    setTimeout(() => setScanResult(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">QR Code Scanner</h3>
        <p className="text-gray-600 mb-4">
          Camera scanning feature would be implemented here using a library like react-qr-reader
        </p>
        <p className="text-sm text-gray-500">For now, use manual input below to test ticket verification</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="manual-input">Manual Ticket Input</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="manual-input"
                  placeholder="Paste ticket QR data or ticket ID..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                />
                <Button onClick={handleManualScan} disabled={!manualInput.trim()}>
                  Verify
                </Button>
              </div>
            </div>

            {scanResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  scanResult.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {scanResult.type === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{scanResult.message}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
