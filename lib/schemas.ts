import { z } from "zod";

// 1. Build Your Sound Schema
export const buildYourSoundSchema = z.object({
  type: z.enum(["Amplifier", "Speaker", "Sound System"], {
    message: "Invalid equipment type",
  }),
  technology: z.string().min(1, "Technology selection is required").max(50),
  tier: z.enum(["Essential", "Premium", "APEX"], {
    message: "Invalid quality tier selection",
  }),
  finish: z.string().nullable().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional().default(""),
  buildName: z.string().max(100, "Configuration name cannot exceed 100 characters").optional().default(""),
  fileUrl: z.string().url("Invalid file URL").nullable().optional(),
}).refine((data) => {
  if (data.type === "Sound System") {
    return true; // Finish is optional/N/A for Sound Systems
  }
  // For Speaker and Amplifier, require a valid finish selection
  const validFinishes = ["Matte Black", "Brushed Silver", "Walnut Wood", "Custom"];
  return data.finish && validFinishes.includes(data.finish);
}, {
  message: "Invalid finish selection for the chosen equipment type",
  path: ["finish"],
});

// 2. Notify Me Schema (upcoming product notifications)
export const notifyMeSchema = z.object({
  productId: z.string().min(1, "Product identifier is required").max(100),
  productName: z.string().min(1, "Product name is required").max(200),
  email: z.string().email("Invalid email format").or(z.literal("")).optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{10,20}$/, "Invalid phone format").or(z.literal("")).optional(),
}).refine((data) => {
  return (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0);
}, {
  message: "At least email or phone must be provided",
  path: ["email"],
});

// 3. User Profile Update Schema
export const profileUpdateSchema = z.object({
  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s.\-']+$/, "Display name contains invalid characters")
    .trim(),
});

// 4. Admin Status Update Schema
export const adminStatusUpdateSchema = z.object({
  id: z.string().min(1, "ID is required").max(100),
  type: z.enum(["order", "customOrder", "enquiry"]),
  status: z.string().min(1, "Status is required").max(50),
}).refine((data) => {
  if (data.type === "order") {
    const validStatuses = ["Processing", "Delivered", "Cancelled", "Received", "Pending"];
    return validStatuses.includes(data.status);
  }
  if (data.type === "customOrder") {
    const validStatuses = [
      "Pending Review", "Contacted", "Confirmed", "Completed",
      "pending", "Designing", "Building", "Testing", "Ready", "Delivered"
    ];
    return validStatuses.includes(data.status);
  }
  if (data.type === "enquiry") {
    const validStatuses = ["Pending", "Resolved", "Contacted"];
    return validStatuses.includes(data.status);
  }
  return false;
}, {
  message: "Invalid status value for the given entity type",
  path: ["status"],
});
