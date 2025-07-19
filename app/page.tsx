import { getAvailableTimeSlots } from "./actions"
import BookingForm from "./components/BookingForm"
import Image from "next/image"

export default async function Home() {
  const slotsResult = await getAvailableTimeSlots()

  if (!slotsResult.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Slots</h1>
          <p className="text-gray-600">{slotsResult.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Image
            src="/crescendo-logo.png"
            alt="Crescendo Sport Lounge Logo"
            width={200}
            height={100}
            className="mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-crescendo-dark mb-2">Crescendo Sport Lounge</h1>
          <p className="text-gray-600">Book your time slot and get your ticket!</p>
        </div>

        <BookingForm timeSlots={slotsResult.data} />
      </div>
    </div>
  )
}
