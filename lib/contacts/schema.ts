import { z } from "zod";

export const ContactSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  subscribedAt: z.string(), // ISO 8601
  source: z.string().default("coming-soon"), // which form submitted
});
export type Contact = z.infer<typeof ContactSchema>;

export const ContactsStateSchema = z.object({
  version: z.number().default(1),
  contacts: z.array(ContactSchema).default([]),
});
export type ContactsState = z.infer<typeof ContactsStateSchema>;
