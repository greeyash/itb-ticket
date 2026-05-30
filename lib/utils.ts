import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { id } from "date-fns/locale";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = "d MMMM yyyy") {
  return format(new Date(date), fmt, { locale: id });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "d MMMM yyyy, HH:mm", { locale: id });
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateTicketCode() {
  return `ITB-${nanoid(4).toUpperCase()}-${nanoid(6).toUpperCase()}`;
}

export function generateCertificateNumber(eventSlug: string) {
  const year = new Date().getFullYear();
  const seq = nanoid(6).toUpperCase();
  return `CERT/${year}/${eventSlug.toUpperCase().slice(0, 8)}/${seq}`;
}

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    + "-" + nanoid(4).toLowerCase();
}

export function generateVerificationHash(data: string) {
  // Simple hash for demo - use bcrypt or crypto in production
  return Buffer.from(data + Date.now().toString()).toString("base64url").slice(0, 32);
}

export function isEventFull(current: number, max: number | null) {
  if (!max) return false;
  return current >= max;
}

export function isRegistrationOpen(deadline: string) {
  return !isPast(new Date(deadline));
}

export function getEventStatusColor(status: string) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    published: "bg-green-100 text-green-700",
    ongoing: "bg-blue-100 text-blue-700",
    completed: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    seminar: "🎤",
    workshop: "🔧",
    competition: "🏆",
    volunteer: "🤝",
    cultural: "🎭",
    sports: "⚽",
    academic: "📚",
    other: "🎪",
  };
  return icons[category] || "🎪";
}

export function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    seminar: "Seminar",
    workshop: "Workshop",
    competition: "Lomba",
    volunteer: "Volunteer",
    cultural: "Budaya",
    sports: "Olahraga",
    academic: "Akademik",
    other: "Lainnya",
  };
  return labels[category] || category;
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrator",
    organizer: "Organizer",
    participant: "Peserta",
  };
  return labels[role] || role;
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    admin: "bg-red-100 text-red-700 border border-red-200",
    organizer: "bg-ocean/10 text-ocean border border-ocean/20",
    participant: "bg-nebula/30 text-copper border border-nebula/50",
  };
  return colors[role] || "bg-gray-100 text-gray-600";
}