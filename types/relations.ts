import type { Tables } from "@/types/database";

export type RegistrationWithEvent = Tables<"registrations"> & {
  event: Tables<"events"> & {
    organizer: {
      full_name: string;
      faculty: string | null;
    } | null;
  } | null;
};

export type EventWithOrganizer = Tables<"events"> & {
  organizer: {
    full_name: string;
    faculty: string | null;
  } | null;
};