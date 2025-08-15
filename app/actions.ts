"use server"

import { supabaseAdmin } from "@/lib/supabase/server"
import { fallbackTimeSlots, fallbackTickets } from "@/lib/supabase/fallback"
import { revalidatePath } from "next/cache"

export interface TimeSlot {
  id: string
  date: string
  time: string
  available_spots: number
  price: number // Price per person per slot
}

export interface Ticket {
  id: string
  user_name: string
  time_slot_id: string
  ticket_number: string
  status: "active" | "used"
  payment_status: "pending" | "paid" | "failed"
  payment_reference?: string
  booking_type?: "single" | "multiple"
  number_of_people: number
  discount_applied: number
  related_tickets?: string[] // For multiple bookings
  created_at: string
  time_slot?: TimeSlot
}

// In-memory storage for fallback mode (explicitly typed to avoid literal-union narrowing)
const memoryTickets: Ticket[] = [...(fallbackTickets as unknown as Ticket[])]
const memoryTimeSlots: TimeSlot[] = [...(fallbackTimeSlots as unknown as TimeSlot[])]
// Add in-memory pending payments for fallback mode
const memoryPendingPayments: { reference: string; metadata: any; status: string }[] = []

export async function getAvailableTimeSlots(): Promise<{ success: boolean; data: TimeSlot[]; error?: string }> {
  try {
    console.log("🔍 getAvailableTimeSlots called")
    console.log("📡 supabaseAdmin exists:", !!supabaseAdmin)
    if (supabaseAdmin) {
      // Attempt Supabase fetch; if it fails (network/env), fall back gracefully
      try {
        console.log("🚀 Attempting Supabase fetch...")
        console.log("📅 Today's date:", new Date().toISOString().split("T")[0])

        // First, let's see what's in the table with no filters
        const { data: allData, error: allError } = await supabaseAdmin
          .from("time_slots")
          .select("*")

        console.log("🔍 All data in table:", { count: allData?.length, error: allError })
        if (allData && allData.length > 0) {
          console.log("📋 Raw table data:", allData.slice(0, 3))
        }

        // Now try with just the available_spots filter
        const { data, error } = await supabaseAdmin
          .from("time_slots")
          .select("*")
          .gt("available_spots", 0)
          .order("date", { ascending: true })
          .order("time", { ascending: true })

        console.log("📊 Supabase response:", { data: data?.length, error })
        if (data && data.length > 0) {
          console.log("📋 First few rows:", data.slice(0, 3))
        }
        if (error) throw error
        return { success: true, data: (data as unknown as TimeSlot[]) || [] }
      } catch (err) {
        console.warn("⚠️ Supabase fetch failed, using fallback:", {
          message: (err as any)?.message || String(err),
        })
        return { success: true, data: memoryTimeSlots.filter((slot) => slot.available_spots > 0) }
      }
    } else {
      console.log("🔄 No Supabase admin, using fallback mode")
      // Fallback mode
      return { success: true, data: memoryTimeSlots.filter((slot) => slot.available_spots > 0) }
    }
  } catch (error) {
    console.error("💥 Unexpected error, using fallback:", {
      message: (error as any)?.message || String(error),
    })
    return {
      success: true,
      data: memoryTimeSlots.filter((slot) => slot.available_spots > 0),
      error: (error as any)?.message || String(error),
    }
  }
}

export async function initiatePayment(formData: FormData) {
  try {
    console.log("💰 initiatePayment called")
    const userName = formData.get("userName") as string
    const timeSlotId = formData.get("timeSlotId") as string
    const timeSlotIds = formData.get("timeSlotIds") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const bookingType = (formData.get("bookingType") as string) || "single"
    const numberOfPeople = Number.parseInt(formData.get("numberOfPeople") as string) || 1
    const discountCode = (formData.get("discountCode") as string) || ""

    console.log("📝 Form data:", { userName, timeSlotId, timeSlotIds, email, phone, bookingType, numberOfPeople, discountCode })

    if (!userName || (!timeSlotId && !timeSlotIds) || !email || numberOfPeople < 1) {
      console.log("❌ Validation failed:", { hasUserName: !!userName, hasTimeSlot: !!(timeSlotId || timeSlotIds), hasEmail: !!email, numberOfPeople })
      return { success: false, error: "Missing required fields or invalid number of people" }
    }

    let totalBaseAmount = 0
    let slotsToBook: string[] = []

    if (bookingType === "multiple" && timeSlotIds) {
      slotsToBook = timeSlotIds.split(",")
    } else if (timeSlotId) {
      slotsToBook = [timeSlotId]
    }

    console.log("🎯 Slots to book:", slotsToBook)

    // Calculate total base amount and validate slots
    for (const slotId of slotsToBook) {
      let timeSlot: TimeSlot | undefined

      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from("time_slots").select("*").eq("id", slotId).single()
        if (error || !data) {
          console.log("❌ Time slot not found:", { slotId, error })
          return { success: false, error: `Time slot ${slotId} not found` }
        }
        timeSlot = data as unknown as TimeSlot
      } else {
        timeSlot = memoryTimeSlots.find((slot) => slot.id === slotId)
      }

      if (!timeSlot) {
        console.log("❌ Time slot not found in memory:", slotId)
        return { success: false, error: `Time slot ${slotId} not found` }
      }

      if (timeSlot.available_spots < numberOfPeople) {
        console.log("❌ Not enough spots:", { available: timeSlot.available_spots, requested: numberOfPeople })
        return { success: false, error: `Not enough spots available for ${timeSlot.time}` }
      }

      totalBaseAmount += timeSlot.price * numberOfPeople
    }

    console.log("💵 Total base amount:", totalBaseAmount)

    let discountAmount = 0
    if (discountCode.toUpperCase() === "SAVE10") {
      discountAmount = totalBaseAmount * 0.1 // 10% discount
    }

    const finalAmount = totalBaseAmount - discountAmount
    console.log("🎫 Final amount after discount:", finalAmount)

    // Generate payment reference
    const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    console.log("🔑 Payment reference:", paymentReference)

    // Store metadata in Supabase for later verification
    if (supabaseAdmin) {
      console.log("💾 Storing metadata in Supabase...")
      try {
        const { error: insertError } = await supabaseAdmin.from("pending_payments").insert({
          reference: paymentReference,
          metadata: {
            userName,
            timeSlotIds: slotsToBook.join(","),
            bookingType,
            phone,
            numberOfPeople,
            discountApplied: discountAmount,
            finalAmount,
          },
          status: "pending",
        })
        if (insertError) {
          console.log("❌ Failed to insert pending payment:", insertError)
          // Fall back to memory storage if Supabase fails
          console.log("🔄 Falling back to memory storage...")
          memoryPendingPayments.push({
            reference: paymentReference,
            metadata: {
              userName,
              timeSlotIds: slotsToBook.join(","),
              bookingType,
              phone,
              numberOfPeople,
              discountApplied: discountAmount,
              finalAmount,
            },
            status: "pending",
          })
        } else {
          console.log("✅ Pending payment stored in Supabase")
        }
      } catch (dbError) {
        console.log("❌ Database error, using memory fallback:", dbError)
        // Fall back to memory storage
        memoryPendingPayments.push({
          reference: paymentReference,
          metadata: {
            userName,
            timeSlotIds: slotsToBook.join(","),
            bookingType,
            phone,
            numberOfPeople,
            discountApplied: discountAmount,
            finalAmount,
          },
          status: "pending",
        })
      }
    } else {
      console.log("💾 Storing metadata in memory...")
      // Fallback mode: persist metadata in memory
      memoryPendingPayments.push({
        reference: paymentReference,
        metadata: {
          userName,
          timeSlotIds: slotsToBook.join(","),
          bookingType,
          phone,
          numberOfPeople,
          discountApplied: discountAmount,
          finalAmount,
        },
        status: "pending",
      })
      console.log("✅ Pending payment stored in memory")
    }

    // In a real app, you would integrate with Paystack here
    console.log("🚀 Simulating Paystack initialization...")
    const paystackResponse = await simulatePaystackInitialization({
      email,
      amount: finalAmount * 100, // Paystack expects amount in kobo
      reference: paymentReference,
    })

    console.log("📱 Paystack response:", paystackResponse)

    if (!paystackResponse.success) {
      console.log("❌ Paystack initialization failed")
      return { success: false, error: "Failed to initialize payment" }
    }

    console.log("✅ Payment initiated successfully")
    return {
      success: true,
      data: {
        paymentUrl: paystackResponse.authorization_url,
        reference: paymentReference,
        amount: finalAmount,
        slots: slotsToBook.length,
      },
    }
  } catch (error) {
    console.error("Error initiating payment:", error)
    return { success: false, error: "Failed to initiate payment" }
  }
}

export async function verifyPaymentAndCreateTicket(reference: string) {
  try {
    // In a real app, verify payment with Paystack
    const paymentVerification = await simulatePaystackVerification(reference)

    if (!paymentVerification.success) {
      // If simulated verification fails, mark pending payment as failed
      if (supabaseAdmin) {
        await supabaseAdmin.from("pending_payments").update({ status: "failed" }).eq("reference", reference)
      }
      return { success: false, error: "Payment verification failed" }
    }

    let metadata: any = null
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("pending_payments")
          .select("metadata")
          .eq("reference", reference)
          .single()
        if (error || !data) {
          // If metadata not found in DB, check memory storage
          console.log("📋 Metadata not found in DB, checking memory storage...")
          const pending = memoryPendingPayments.find((p) => p.reference === reference)
          if (pending) {
            console.log("✅ Found metadata in memory storage")
            metadata = pending.metadata
            pending.status = "completed"
          } else {
            console.error("❌ Metadata not found in DB or memory for reference:", reference)
            return { success: false, error: "Payment metadata not found" }
          }
        } else {
          metadata = data.metadata
        }
      } catch (dbError) {
        console.log("❌ Database error during verification, checking memory:", dbError)
        // Fall back to memory storage
        const pending = memoryPendingPayments.find((p) => p.reference === reference)
        if (pending) {
          console.log("✅ Found metadata in memory storage")
          metadata = pending.metadata
          pending.status = "completed"
        } else {
          console.error("❌ Metadata not found in memory for reference:", reference)
          return { success: false, error: "Payment metadata not found" }
        }
      }
    } else {
      // Fallback mode: retrieve metadata from memory
      const pending = memoryPendingPayments.find((p) => p.reference === reference)
      if (pending) {
        metadata = pending.metadata
        pending.status = "completed"
      } else {
        // fallback fallback
        metadata = {
          userName: "Fallback User",
          timeSlotIds: "1",
          bookingType: "single",
          phone: "",
          numberOfPeople: 1,
          discountApplied: 0,
          finalAmount: 4000,
        }
      }
    }

    const { userName, timeSlotIds, bookingType, phone, numberOfPeople, discountApplied } = metadata
    const slotsToBook = timeSlotIds.split(",")

    const createdTickets: Ticket[] = []
    const ticketIds: string[] = []

    // Create tickets for each slot
    for (const timeSlotId of slotsToBook) {
      let timeSlot: TimeSlot | undefined

      if (supabaseAdmin) {
        const { data } = await supabaseAdmin.from("time_slots").select("*").eq("id", timeSlotId).single()
        timeSlot = (data as unknown as TimeSlot) ?? undefined
      } else {
        timeSlot = memoryTimeSlots.find((slot) => slot.id === timeSlotId)
      }

      if (!timeSlot) {
        continue // Skip invalid slots
      }

      // Generate ticket
      const ticketNumber = `FC${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 4).toUpperCase()}`
      const ticketId = Math.random().toString(36).substring(2, 15)

      const newTicket: Ticket = {
        id: ticketId,
        user_name: userName,
        time_slot_id: timeSlotId,
        ticket_number: ticketNumber,
        status: "active",
        payment_status: "paid",
        payment_reference: reference,
        booking_type: bookingType as "single" | "multiple",
        number_of_people: numberOfPeople,
        discount_applied: discountApplied,
        created_at: new Date().toISOString(),
        time_slot: timeSlot,
      }

      ticketIds.push(ticketId)

      if (supabaseAdmin) {
        const { data: ticket, error } = await supabaseAdmin
          .from("tickets")
          .insert({
            user_name: userName,
            time_slot_id: timeSlotId,
            ticket_number: ticketNumber,
            status: "active",
            payment_status: "paid",
            payment_reference: reference,
            booking_type: bookingType,
            number_of_people: numberOfPeople,
            discount_applied: discountApplied,
          })
          .select(`
            *,
            time_slot:time_slots(*)
          `)
          .single()

        if (error) throw error

        // Update available spots
        await supabaseAdmin
          .from("time_slots")
          .update({ available_spots: timeSlot.available_spots - numberOfPeople })
          .eq("id", timeSlotId)

        createdTickets.push(ticket as unknown as Ticket)
      } else {
        // Fallback mode
        memoryTickets.push(newTicket)
        timeSlot.available_spots -= numberOfPeople
        createdTickets.push(newTicket)
      }
    }

    // Update all tickets with related ticket IDs for multiple bookings
    if (bookingType === "multiple" && createdTickets.length > 1) {
      for (const ticket of createdTickets) {
        const relatedIds = ticketIds.filter((id) => id !== ticket.id)

        if (supabaseAdmin) {
          await supabaseAdmin.from("tickets").update({ related_tickets: relatedIds }).eq("id", ticket.id)
        } else {
          const memoryTicket = memoryTickets.find((t) => t.id === ticket.id)
          if (memoryTicket) {
            ; (memoryTicket as Ticket).related_tickets = relatedIds
          }
        }
      }
    }

    // Mark pending payment as completed
    if (supabaseAdmin) {
      await supabaseAdmin.from("pending_payments").update({ status: "completed" }).eq("reference", reference)
    }

    revalidatePath("/")

    // Return the first ticket (or single ticket)
    return { success: true, data: createdTickets[0] }
  } catch (error) {
    console.error("Error creating ticket:", error)
    // Mark pending payment as failed if an error occurs during ticket creation
    if (supabaseAdmin) {
      await supabaseAdmin.from("pending_payments").update({ status: "failed" }).eq("reference", reference)
    }
    return { success: false, error: "Failed to create ticket" }
  }
}

// Simulate Paystack payment initialization
async function simulatePaystackInitialization(data: {
  email: string
  amount: number
  reference: string
}) {
  // In production, replace with actual Paystack API call
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay

  return {
    success: true,
    authorization_url: `/payment/verify?reference=${data.reference}`,
    access_code: "access_code_123",
    reference: data.reference,
  }
}

// Simulate Paystack payment verification
async function simulatePaystackVerification(reference: string) {
  // In production, replace with actual Paystack verification
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In this simulation, we assume payment is always successful if a reference exists.
  // The actual metadata retrieval is now handled by verifyPaymentAndCreateTicket from DB.
  return {
    success: true,
    status: "success",
  }
}

export async function bookTicket(formData: FormData) {
  // Legacy function - redirect to payment flow
  return await initiatePayment(formData)
}

export async function getAllTickets() {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("tickets")
        .select(`
          *,
          time_slot:time_slots(*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return { success: true, data: data || [] }
    } else {
      // Fallback mode
      return { success: true, data: memoryTickets }
    }
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return { success: false, error: "Failed to fetch tickets" }
  }
}

export async function markTicketAsUsed(ticketId: string) {
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from("tickets").update({ status: "used" }).eq("id", ticketId)

      if (error) throw error
    } else {
      // Fallback mode
      const ticket = memoryTickets.find((t) => t.id === ticketId)
      if (ticket) {
        ticket.status = "used"
      }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating ticket:", error)
    return { success: false, error: "Failed to update ticket" }
  }
}

// Legacy functions for backward compatibility
export async function createTicket(data: { customerName: string; date: string; timeSlot: string }) {
  try {
    const newTicket = {
      id: Math.random().toString(36).substring(2, 15),
      customerName: data.customerName,
      date: data.date,
      timeSlot: data.timeSlot,
      status: "active" as const,
      createdAt: new Date().toISOString(),
    }
    return newTicket
  } catch (error) {
    console.error("Error creating ticket:", error)
    throw new Error("Failed to create ticket")
  }
}

export async function getTicket(id: string) {
  try {
    if (supabaseAdmin) {
      const { data: ticket, error } = await supabaseAdmin
        .from("tickets")
        .select(`
          *,
          time_slot:time_slots(*)
        `)
        .eq("id", id)
        .single()

      if (error || !ticket) {
        return null
      }

      return ticket
    } else {
      // Fallback mode
      return memoryTickets.find((ticket) => ticket.id === id) || null
    }
  } catch (error) {
    console.error("Error getting ticket:", error)
    return null
  }
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  try {
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from("tickets").update({ status: newStatus }).eq("id", ticketId)

      if (error) throw error
    } else {
      // Fallback mode
      const ticket = memoryTickets.find((t) => t.id === ticketId)
      if (ticket) {
        ticket.status = newStatus as "active" | "used"
      }
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Error updating ticket status:", error)
    return { success: false, error: "Failed to update ticket status" }
  }
}
