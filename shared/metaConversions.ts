import { z } from "zod";

// Only attribution signals travel from the browser. Event names, IDs, contact
// details and successful business actions are determined by the server.
export const metaAttributionSchema = z.object({
  consent: z.literal(true),
  fbp: z.string().regex(/^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/).max(255).optional(),
  fbc: z.string().regex(/^fb\.\d+\.\d+\.[A-Za-z0-9_-]+$/).max(500).optional(),
});

export type MetaAttribution = z.infer<typeof metaAttributionSchema>;

export function registrationData(userType: "homeowner" | "handyman") {
  return {
    content_name: userType === "homeowner" ? "Homeowner Signup" : "Handyman Signup",
    status: "completed",
    registration_method: "website",
    user_type: userType,
  };
}

export const jobLeadData = {
  content_name: "Customer Job Posted",
  lead_source: "website",
  user_type: "homeowner",
};
