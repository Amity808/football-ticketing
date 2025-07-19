// Fallback data for when Supabase is not configured
export const fallbackTimeSlots = [
  {
    id: "1",
    date: new Date().toISOString().split("T")[0],
    time: "09:00:00",
    available_spots: 8,
    price: 4000, // ₦4,000 per person per slot
  },
  {
    id: "2",
    date: new Date().toISOString().split("T")[0],
    time: "11:00:00",
    available_spots: 10,
    price: 4000,
  },
  {
    id: "3",
    date: new Date().toISOString().split("T")[0],
    time: "13:00:00",
    available_spots: 5,
    price: 4000,
  },
  {
    id: "4",
    date: new Date().toISOString().split("T")[0],
    time: "15:00:00",
    available_spots: 7,
    price: 4000,
  },
  {
    id: "5",
    date: new Date().toISOString().split("T")[0],
    time: "17:00:00",
    available_spots: 9,
    price: 4000,
  },
  {
    id: "6",
    date: new Date().toISOString().split("T")[0],
    time: "19:00:00",
    available_spots: 6,
    price: 4000,
  },
]

export const fallbackTickets = [
  {
    id: "ticket-1",
    user_name: "Chukwudi Okafor",
    time_slot_id: "1",
    ticket_number: "FC123456",
    status: "active" as const,
    created_at: new Date().toISOString(),
    payment_status: "paid" as const,
    payment_reference: "PAY_123456789",
    number_of_people: 1,
    discount_applied: 0,
    time_slot: fallbackTimeSlots[0],
  },
  {
    id: "ticket-2",
    user_name: "Amina Hassan",
    time_slot_id: "2",
    ticket_number: "FC789012",
    status: "used" as const,
    created_at: new Date().toISOString(),
    payment_status: "paid" as const,
    payment_reference: "PAY_987654321",
    number_of_people: 2,
    discount_applied: 800, // 10% off 8000
    time_slot: fallbackTimeSlots[1],
  },
]
