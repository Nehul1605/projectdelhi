export type Role = "USER" | "MODERATOR" | "ADMIN";

export type TaskStatus =
  | "pending"
  | "verified"
  | "approved"
  | "rejected"
  | "completed";

export type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "approved"
  | "rejected";

export type ApplicantType = "individual" | "group";

export interface CurrentUser {
  email: string;
  role: Role;
  name: string;
}

export interface VolunteerApp {
  id: string;
  name: string;
  email: string;
  phone: string;
  reason: string;
  status: ApplicationStatus;
  createdAt: string;
}

export type TaskCategory =
  | "cleanup"
  | "plantation"
  | "education"
  | "healthcare"
  | "food-drive"
  | "animal-welfare"
  | "awareness"
  | "other";

export interface TaskRequest {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  applicantType: ApplicantType;
  applicantName: string;
  organizationName?: string;
  email: string;
  phone: string;
  address: string;
  locality: string;
  city: string;
  pincode: string;
  eventDate: string;
  eventTime: string;
  volunteersNeeded: number;
  status: TaskStatus;
  createdAt: string;
  volunteers: Volunteer[];
  imageUrl?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  message?: string;
}

export const CATEGORY_META: Record<
  TaskCategory,
  { label: string; emoji: string; color: string }
> = {
  cleanup: { label: "Cleanup Drive", emoji: "🧹", color: "#10B981" },
  plantation: { label: "Tree Plantation", emoji: "🌳", color: "#059669" },
  education: { label: "Education Camp", emoji: "📚", color: "#6366F1" },
  healthcare: { label: "Health Camp", emoji: "🏥", color: "#EF4444" },
  "food-drive": { label: "Food Drive", emoji: "🍱", color: "#F59E0B" },
  "animal-welfare": { label: "Animal Welfare", emoji: "🐾", color: "#8B5CF6" },
  awareness: { label: "Awareness Campaign", emoji: "📢", color: "#3B82F6" },
  other: { label: "Other Initiative", emoji: "💡", color: "#EC4899" },
};
