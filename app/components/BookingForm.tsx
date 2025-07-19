"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { initiatePayment, type TimeSlot } from "../actions"
import { formatNairaSimple } from "@/lib/utils/currency"
import { Clock, CreditCard, User, Users, Calendar, Percent } from "lucide-react"

interface BookingFormProps {
  timeSlots: TimeSlot[]
}

export default function BookingForm({ timeSlots }: BookingFormProps) {
  const [activeTab, setActiveTab] = useState("single")

  // Single slot booking state
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [singleNumPeople, setSingleNumPeople] = useState(1)
  const [singleDiscountCode, setSingleDiscountCode] = useState("")

  // Multiple slots booking state
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [multiUserName, setMultiUserName] = useState("")
  const [multiEmail, setMultiEmail] = useState("")
  const [multiPhone, setMultiPhone] = useState("")
  const [multiNumPeople, setMultiNumPeople] = useState(1)
  const [multiDiscountCode, setMultiDiscountCode] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const selectedTimeSlot = timeSlots.find((slot) => slot.id === selectedSlot)
  const selectedTimeSlots = timeSlots.filter((slot) => selectedSlots.includes(slot.id))

  const calculatePrice = (basePrice: number, numPeople: number, discountCode: string) => {
    const total = basePrice * numPeople
    let discountAmount = 0
    if (discountCode.toUpperCase() === "SAVE10") {
      discountAmount = total * 0.1 // 10% discount
    }
    return { total: total - discountAmount, discountAmount }
  }

  const singleBookingPrice = useMemo(() => {
    if (!selectedTimeSlot) return { total: 0, discountAmount: 0 }
    return calculatePrice(selectedTimeSlot.price, singleNumPeople, singleDiscountCode)
  }, [selectedTimeSlot, singleNumPeople, singleDiscountCode])

  const multiBookingPrice = useMemo(() => {
    const baseTotal = selectedTimeSlots.reduce((sum, slot) => sum + slot.price, 0)
    return calculatePrice(baseTotal, multiNumPeople, multiDiscountCode)
  }, [selectedTimeSlots, multiNumPeople, multiDiscountCode])

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim() || !selectedSlot || !email.trim() || singleNumPeople < 1) {
      setError("Please fill in all required fields and ensure number of people is valid.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("userName", userName.trim())
    formData.append("timeSlotId", selectedSlot)
    formData.append("email", email.trim())
    formData.append("phone", phone.trim())
    formData.append("numberOfPeople", singleNumPeople.toString())
    formData.append("discountCode", singleDiscountCode)
    formData.append("bookingType", "single")

    const result = await initiatePayment(formData)

    if (result.success && result.data) {
      window.location.href = result.data.paymentUrl
    } else {
      setError(result.error || "Failed to initiate payment")
    }

    setIsLoading(false)
  }

  const handleMultipleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!multiUserName.trim() || selectedSlots.length === 0 || !multiEmail.trim() || multiNumPeople < 1) {
      setError(
        "Please fill in all required fields, select at least one time slot, and ensure number of people is valid.",
      )
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(multiEmail)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("userName", multiUserName.trim())
    formData.append("timeSlotIds", selectedSlots.join(","))
    formData.append("email", multiEmail.trim())
    formData.append("phone", multiPhone.trim())
    formData.append("numberOfPeople", multiNumPeople.toString())
    formData.append("discountCode", multiDiscountCode)
    formData.append("bookingType", "multiple")

    const result = await initiatePayment(formData)

    if (result.success && result.data) {
      window.location.href = result.data.paymentUrl
    } else {
      setError(result.error || "Failed to initiate payment")
    }

    setIsLoading(false)
  }

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlots((prev) => (prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]))
  }

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

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl flex items-center justify-center gap-2">
          <Clock className="h-6 w-6" />
          Book Your Football Session
        </CardTitle>
        <p className="text-center text-gray-600">Choose single slot or multiple slots for your booking</p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Single Slot
            </TabsTrigger>
            <TabsTrigger value="multiple" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Multiple Slots
            </TabsTrigger>
          </TabsList>

          {/* Single Slot Booking */}
          <TabsContent value="single" className="space-y-6">
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName">Full Name *</Label>
                    <Input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>
              </div>

              {/* Number of People */}
              <div>
                <Label htmlFor="singleNumPeople">Number of People *</Label>
                <Input
                  id="singleNumPeople"
                  type="number"
                  value={singleNumPeople}
                  onChange={(e) => setSingleNumPeople(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="w-full md:w-1/2"
                  required
                />
              </div>

              {/* Time Slot Selection */}
              <div>
                <Label className="text-lg font-semibold">Select Time Slot</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSlot === slot.id
                          ? "border-crescendo-red bg-crescendo-red/5 ring-2 ring-crescendo-red/20"
                          : "border-gray-200 hover:border-crescendo-red/50 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedSlot(slot.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{formatDate(slot.date)}</div>
                          <div className="text-sm text-gray-600 mt-1">{formatTime(slot.time)}</div>
                          <div className="text-xs text-gray-500 mt-1">{slot.available_spots} spots available</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-crescendo-red text-lg">{formatNairaSimple(slot.price)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Code */}
              <div>
                <Label htmlFor="singleDiscountCode" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Discount Code (Optional)
                </Label>
                <Input
                  id="singleDiscountCode"
                  type="text"
                  value={singleDiscountCode}
                  onChange={(e) => setSingleDiscountCode(e.target.value)}
                  placeholder="e.g., SAVE10"
                  className="w-full md:w-1/2"
                />
              </div>

              {/* Payment Summary */}
              {selectedTimeSlot && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Session Fee (per person):</span>
                      <span className="font-semibold">{formatNairaSimple(selectedTimeSlot.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of People:</span>
                      <span className="font-semibold">{singleNumPeople}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        {formatNairaSimple(selectedTimeSlot.price * singleNumPeople)}
                      </span>
                    </div>
                    {singleDiscountCode.toUpperCase() === "SAVE10" && (
                      <div className="flex justify-between text-crescendo-red">
                        <span>Discount (10%):</span>
                        <span className="font-semibold">- {formatNairaSimple(singleBookingPrice.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span className="font-semibold">₦0</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-crescendo-red">{formatNairaSimple(singleBookingPrice.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-crescendo-red hover:bg-crescendo-red-dark text-white py-3"
                disabled={isLoading || !userName.trim() || !selectedSlot || !email.trim() || singleNumPeople < 1}
              >
                {isLoading ? (
                  "Processing..."
                ) : selectedTimeSlot ? (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {formatNairaSimple(singleBookingPrice.total)} & Book Session
                  </>
                ) : (
                  "Select Time Slot to Continue"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Multiple Slots Booking */}
          <TabsContent value="multiple" className="space-y-6">
            <div className="bg-crescendo-orange/5 p-4 rounded-lg border border-crescendo-orange/20">
              <div className="flex items-center gap-2 text-crescendo-orange-dark">
                <Users className="h-5 w-5" />
                <span className="font-semibold">Multiple Slots Booking</span>
              </div>
              <p className="text-crescendo-orange-dark text-sm mt-1">
                Select multiple time slots for extended play time or group sessions. Perfect for tournaments or extended
                practice.
              </p>
            </div>

            <form onSubmit={handleMultipleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="multiUserName">Full Name *</Label>
                    <Input
                      id="multiUserName"
                      type="text"
                      value={multiUserName}
                      onChange={(e) => setMultiUserName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="multiEmail">Email Address *</Label>
                    <Input
                      id="multiEmail"
                      type="email"
                      value={multiEmail}
                      onChange={(e) => setMultiEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="multiPhone">Phone Number (Optional)</Label>
                  <Input
                    id="multiPhone"
                    type="tel"
                    value={multiPhone}
                    onChange={(e) => setMultiPhone(e.target.value)}
                    placeholder="+234 xxx xxx xxxx"
                  />
                </div>
              </div>

              {/* Number of People */}
              <div>
                <Label htmlFor="multiNumPeople">Number of People *</Label>
                <Input
                  id="multiNumPeople"
                  type="number"
                  value={multiNumPeople}
                  onChange={(e) => setMultiNumPeople(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="w-full md:w-1/2"
                  required
                />
              </div>

              {/* Multiple Time Slots Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-semibold">Select Time Slots</Label>
                  {selectedSlots.length > 0 && (
                    <Badge variant="secondary">
                      {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedSlots.includes(slot.id)
                          ? "border-crescendo-orange bg-crescendo-orange/5 ring-2 ring-crescendo-orange/20"
                          : "border-gray-200 hover:border-crescendo-orange/50 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSlotSelection(slot.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{formatDate(slot.date)}</div>
                          <div className="text-sm text-gray-600 mt-1">{formatTime(slot.time)}</div>
                          <div className="text-xs text-gray-500 mt-1">{slot.available_spots} spots available</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-crescendo-orange text-lg">{formatNairaSimple(slot.price)}</div>
                          {selectedSlots.includes(slot.id) && (
                            <Badge className="mt-1 bg-crescendo-orange">Selected</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Code */}
              <div>
                <Label htmlFor="multiDiscountCode" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Discount Code (Optional)
                </Label>
                <Input
                  id="multiDiscountCode"
                  type="text"
                  value={multiDiscountCode}
                  onChange={(e) => setMultiDiscountCode(e.target.value)}
                  placeholder="e.g., SAVE10"
                  className="w-full md:w-1/2"
                />
              </div>

              {/* Multiple Slots Payment Summary */}
              {selectedSlots.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Summary
                  </h3>
                  <div className="space-y-2">
                    {selectedTimeSlots.map((slot, index) => (
                      <div key={slot.id} className="flex justify-between text-sm">
                        <span>
                          Session {index + 1} ({formatTime(slot.time)}):
                        </span>
                        <span className="font-semibold">{formatNairaSimple(slot.price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span>Number of People:</span>
                      <span className="font-semibold">{multiNumPeople}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-semibold">
                        {formatNairaSimple(multiBookingPrice.total + multiBookingPrice.discountAmount)}
                      </span>
                    </div>
                    {multiDiscountCode.toUpperCase() === "SAVE10" && (
                      <div className="flex justify-between text-crescendo-red">
                        <span>Discount (10%):</span>
                        <span className="font-semibold">- {formatNairaSimple(multiBookingPrice.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Processing Fee:</span>
                      <span className="font-semibold">₦0</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total ({selectedSlots.length} slots):</span>
                      <span className="text-crescendo-orange">{formatNairaSimple(multiBookingPrice.total)}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">{error}</div>}

              <Button
                type="submit"
                className="w-full bg-crescendo-orange hover:bg-crescendo-orange-dark text-white py-3"
                disabled={
                  isLoading ||
                  !multiUserName.trim() ||
                  selectedSlots.length === 0 ||
                  !multiEmail.trim() ||
                  multiNumPeople < 1
                }
              >
                {isLoading ? (
                  "Processing..."
                ) : selectedSlots.length > 0 ? (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pay {formatNairaSimple(multiBookingPrice.total)} & Book {selectedSlots.length} Session
                    {selectedSlots.length > 1 ? "s" : ""}
                  </>
                ) : (
                  "Select Time Slots to Continue"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-gray-500 text-center mt-4">
          By proceeding, you agree to our terms and conditions. Payment is processed securely via Paystack.
        </p>
      </CardContent>
    </Card>
  )
}
