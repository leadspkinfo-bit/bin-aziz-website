"use server";

import { createClient } from "@/lib/supabase/server";
import { services } from "@/lib/content";

export type InquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "email" | "message", string>>;
  /** Echoed back on failure so the form keeps what the visitor typed. */
  values?: Record<string, string>;
};

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? "").trim().slice(0, max);

// Public form: no auth needed, but every field is validated and length-capped
// here and again by the table's check constraints.
export async function submitInquiry(_: InquiryState, formData: FormData): Promise<InquiryState> {
  // Bots fill the hidden field; humans never see it.
  if (clean(formData.get("company"), 100)) return { status: "success", message: "Thank you!" };

  const data = {
    name: clean(formData.get("name"), 120),
    phone: clean(formData.get("phone"), 30),
    email: clean(formData.get("email"), 160) || null,
    service: clean(formData.get("service"), 60) || null,
    travellers: Number(formData.get("travellers")) || null,
    travel_month: clean(formData.get("travel_month"), 20) || null,
    message: clean(formData.get("message"), 2000) || null,
  };

  const values = Object.fromEntries(
    ["name", "phone", "email", "service", "travellers", "travel_month", "message"].map((k) => [k, clean(formData.get(k), 2000)]),
  );
  const errors: InquiryState["errors"] = {};
  if (data.name.length < 2) errors.name = "Please enter your name.";
  if (!/^\+?[\d\s-]{7,20}$/.test(data.phone)) errors.phone = "Please enter a valid phone number.";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Please enter a valid email.";
  if (data.service && !services.some((s) => s.slug === data.service)) data.service = null;
  if (data.travellers !== null && (data.travellers < 1 || data.travellers > 500)) data.travellers = null;
  if (Object.keys(errors).length) return { status: "error", errors, values, message: "Please check the highlighted fields." };

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert(data);
  if (error) {
    console.error("inquiry insert failed:", error.message);
    return { status: "error", values, message: "Something went wrong. Please try again or message us on WhatsApp." };
  }
  return { status: "success", message: "JazakAllah khair! Our team will contact you shortly." };
}
