import { z } from "zod";

/**
 * Validation schema for the seller registration form.
 *
 * Keeping it in its own module means the same rules can be reused by other
 * surfaces (dashboard profile editing, future server-side checks).
 */
export const sellerRegistrationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, "Business name must be at least 3 characters")
    .max(80, "Business name must be less than 80 characters"),

  ownerName: z
    .string()
    .trim()
    .min(2, "Owner name must be at least 2 characters")
    .max(50, "Owner name must be less than 50 characters"),

  categoryId: z.string().min(1, "Please select a business category"),

  area: z.string().trim().min(2, "Please enter your area").max(60, "Area name is too long"),

  city: z.string().trim().min(2, "Please enter your city").max(40, "City name is too long"),

  instagram: z
    .string()
    .trim()
    .min(1, "Instagram handle is required")
    .transform((s) => s.replace(/^@+/, ""))
    .refine(
      (s) => /^[a-zA-Z0-9_.]{1,30}$/.test(s),
      "Instagram handle can only contain letters, numbers, dots and underscores (max 30 characters)",
    ),

  whatsapp: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s\-()]/g, "").replace(/^\+/, ""))
    .refine((s) => /^[0-9]{10,15}$/.test(s), "Enter a valid number with country code, digits only"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(120, "Email must be less than 120 characters"),

  priceFrom: z.coerce
    .number({ invalid_type_error: "Starting price must be a number" })
    .min(0, "Price must be ₹0 or more")
    .max(999999, "Price seems too high. Please check and re-enter"),

  tagline: z
    .string()
    .trim()
    .min(6, "Write one line about your business")
    .max(150, "Tagline must be less than 150 characters"),

  about: z
    .string()
    .trim()
    .min(20, "Tell customers a bit more about your business")
    .max(1000, "About section must be less than 1000 characters"),
});

export type SellerRegistrationInput = z.infer<typeof sellerRegistrationSchema>;
