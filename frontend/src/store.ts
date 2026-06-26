import {
  TaskRequest,
  Volunteer,
  VolunteerApp,
  CurrentUser,
  Role,
} from "./types";
import type { TaskStatus, ApplicationStatus } from "./types";

const STORAGE_KEY = "project_delhi_tasks";
const VOLUNTEER_APPS_KEY = "project_delhi_volunteer_apps";
const CURRENT_USER_KEY = "project_delhi_current_user";
const REGISTERED_EMAILS_KEY = "project_delhi_registered_emails";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

// Local cache
let cachedTasks: TaskRequest[] = [];
let cachedApps: VolunteerApp[] = [];
let cachedUsers: { email: string; name: string; role: Role }[] = [];

// Initialize store by fetching initial data from backend
export async function initStore(): Promise<void> {
  try {
    const [tasksRes, appsRes, usersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/tasks`),
      fetch(`${API_BASE_URL}/volunteer-apps`),
      fetch(`${API_BASE_URL}/users`),
    ]);
    if (tasksRes.ok && appsRes.ok && usersRes.ok) {
      cachedTasks = await tasksRes.json();
      cachedApps = await appsRes.json();
      cachedUsers = await usersRes.json();
      console.log("Successfully synchronized store cache with backend.");
      return;
    }
  } catch (error) {
    console.error("Failed to load initial data from backend, falling back to local storage.", error);
  }

  // Fallback to localStorage just in case backend is offline
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    const storedApps = localStorage.getItem(VOLUNTEER_APPS_KEY);
    cachedTasks = storedTasks ? JSON.parse(storedTasks) : [];
    cachedApps = storedApps ? JSON.parse(storedApps) : [];
    cachedUsers = [];
  } catch (e) {
    console.error("Error loading fallback data", e);
    cachedTasks = [];
    cachedApps = [];
    cachedUsers = [];
  }
}

export function getTasks(): TaskRequest[] {
  return cachedTasks;
}

export function getApprovedTasks(): TaskRequest[] {
  return cachedTasks.filter((t) => t.status === "approved");
}

export function getPendingTasks(): TaskRequest[] {
  return cachedTasks.filter((t) => t.status === "pending");
}

export function getTaskById(id: string): TaskRequest | undefined {
  return cachedTasks.find((t) => t.id === id);
}

export function addTask(
  task: Omit<TaskRequest, "id" | "status" | "createdAt" | "volunteers">,
): TaskRequest {
  const newTask: TaskRequest = {
    ...task,
    id: "task-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    status: "pending",
    createdAt: new Date().toISOString(),
    volunteers: [],
  };
  cachedTasks.push(newTask);

  // Sync with backend in background
  fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newTask),
  }).catch((err) => console.error("Failed to sync new task to backend", err));

  return newTask;
}

export function updateTaskStatus(id: string, status: TaskStatus): void {
  const idx = cachedTasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    cachedTasks[idx].status = status;

    // Sync with backend in background
    fetch(`${API_BASE_URL}/tasks/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error("Failed to sync task status to backend", err));
  }
}

export async function requestTaskDetails(id: string, moderatorRequest: string): Promise<void> {
  const idx = cachedTasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    cachedTasks[idx].moderatorRequest = moderatorRequest;
    
    const res = await fetch(`${API_BASE_URL}/tasks/${id}/request`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moderatorRequest }),
    });
    if (!res.ok) {
      throw new Error("Failed to send request to server");
    }
  }
}

export async function respondToTaskRequest(id: string, userResponse: string): Promise<void> {
  const idx = cachedTasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    cachedTasks[idx].userResponse = userResponse;

    const res = await fetch(`${API_BASE_URL}/tasks/${id}/respond`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userResponse }),
    });
    if (!res.ok) {
      throw new Error("Failed to submit response to server");
    }
  }
}


export function addVolunteer(
  taskId: string,
  volunteer: Omit<Volunteer, "id" | "joinedAt">,
): boolean {
  const idx = cachedTasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return false;

  // Check duplicate email
  if (cachedTasks[idx].volunteers.some((v) => v.email === volunteer.email)) {
    return false;
  }

  const newVol: Volunteer = {
    ...volunteer,
    id: "vol-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    joinedAt: new Date().toISOString(),
  };
  cachedTasks[idx].volunteers.push(newVol);

  // Sync with backend in background
  fetch(`${API_BASE_URL}/tasks/${taskId}/volunteers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newVol),
  }).catch((err) => console.error("Failed to sync new volunteer to backend", err));

  return true;
}

// --- Volunteer Applications ---

export function getVolunteerApps(): VolunteerApp[] {
  return cachedApps;
}

export function addVolunteerApp(
  app: Omit<VolunteerApp, "id" | "status" | "createdAt">,
): VolunteerApp {
  const newApp: VolunteerApp = {
    ...app,
    id: "vapp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    status: "applied",
    createdAt: new Date().toISOString(),
  };
  cachedApps.push(newApp);

  // Sync with backend in background
  fetch(`${API_BASE_URL}/volunteer-apps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newApp),
  }).catch((err) => console.error("Failed to sync volunteer app to backend", err));

  return newApp;
}

export function updateVolunteerAppStatus(
  id: string,
  status: ApplicationStatus,
): void {
  const idx = cachedApps.findIndex((a) => a.id === id);
  if (idx !== -1) {
    const app = cachedApps[idx];
    app.status = status;

    if (status === "approved") {
      const taskIdx = cachedTasks.findIndex((t) => t.id === app.taskId);
      if (taskIdx !== -1) {
        const task = cachedTasks[taskIdx];
        if (!task.volunteers.some((v) => v.email === app.email)) {
          task.volunteers.push({
            id: "vol-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
            name: app.name,
            email: app.email,
            phone: app.phone,
            joinedAt: new Date().toISOString(),
            message: app.reason
          });
        }
      }
    }

    // Sync with backend in background
    fetch(`${API_BASE_URL}/volunteer-apps/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error("Failed to sync volunteer app status to backend", err));
  }
}

// --- Auth & RBAC ---

export function getRegisteredRole(email: string): Role {
  const normalizedEmail = email.toLowerCase().trim();
  const match = cachedUsers.find((u) => u.email.toLowerCase().trim() === normalizedEmail);
  if (match) return match.role;

  // Defaults based on mock emails
  if (normalizedEmail === "admin@projectdelhi.org") return "ADMIN";
  if (
    [
      "rahul@projectdelhi.org",
      "priya@projectdelhi.org",
      "raghav@projectdelhi.org",
    ].includes(normalizedEmail)
  ) {
    return "MODERATOR";
  }
  return "USER";
}

export function getCurrentUser(): CurrentUser | null {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null;
}

export function loginUser(email: string, name: string): CurrentUser {
  const role = getRegisteredRole(email);
  const user: CurrentUser = { email: email.toLowerCase(), name, role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  // Sync registering/logging in user with backend in background
  if (!cachedUsers.some((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim())) {
    const newUser = { email: email.toLowerCase().trim(), name, role };
    cachedUsers.push(newUser);
    fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    }).catch((err) => console.error("Failed to register user to backend", err));
  }

  return user;
}

export async function loginWithGoogle(token: string): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to authenticate with Google");
  }
  const user: CurrentUser = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  if (!cachedUsers.some((u) => u.email.toLowerCase().trim() === user.email.toLowerCase().trim())) {
    cachedUsers.push(user);
  }

  return user;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to sign in. Please verify your credentials.");
  }
  const user: CurrentUser = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  if (!cachedUsers.some((u) => u.email.toLowerCase().trim() === user.email.toLowerCase().trim())) {
    cachedUsers.push(user);
  }

  return user;
}

export async function registerWithEmailPassword(name: string, email: string, password: string): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: "USER"
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create account.");
  }
  const user: CurrentUser = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

  if (!cachedUsers.some((u) => u.email.toLowerCase().trim() === user.email.toLowerCase().trim())) {
    cachedUsers.push(user);
  }

  return user;
}

export function userLogout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getVerifiedTasks(): TaskRequest[] {
  return cachedTasks.filter((t) => t.status === "verified");
}

export function resetToSeedData(): void {
  // Sync with backend in background
  fetch(`${API_BASE_URL}/reset`, {
    method: "POST",
  })
    .then(() => initStore())
    .catch((err) => console.error("Failed to reset backend data", err));
}

export function getStats() {
  const approved = cachedTasks.filter((t) => t.status === "approved");
  const totalVolunteers = approved.reduce(
    (sum, t) => sum + t.volunteers.length,
    0,
  );
  return {
    totalTasks: approved.length,
    totalVolunteers,
    totalPending: cachedTasks.filter((t) => t.status === "pending").length,
    localities: [...new Set(approved.map((t) => t.locality))].length,
  };
}

export async function subscribeEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.error || "Failed to subscribe." };
    }
    return await response.json();
  } catch (error: any) {
    console.error("Subscription failed:", error);
    return { success: false, message: error.message || "Connection error." };
  }
}

export async function getSubscribers(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscribers`);
    if (!response.ok) {
      throw new Error("Failed to fetch subscribers.");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return [];
  }
}

export interface GeneralVolunteer {
  name: string;
  email: string;
  phone: string;
  preferredRole: string;
  location: string;
  createdAt: string;
}

export async function registerGeneralVolunteer(
  data: Omit<GeneralVolunteer, "createdAt">,
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/general-volunteers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.error || "Failed to register." };
    }
    return await response.json();
  } catch (error: any) {
    console.error("General volunteer registration failed:", error);
    return { success: false, message: error.message || "Connection error." };
  }
}

export async function getGeneralVolunteers(): Promise<GeneralVolunteer[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/general-volunteers`);
    if (!response.ok) {
      throw new Error("Failed to fetch general volunteers.");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch general volunteers:", error);
    return [];
  }
}

export interface DonationReport {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  method: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export async function reportDonation(
  data: Omit<DonationReport, 'id' | 'status' | 'createdAt'>
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/donations/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.error || "Failed to submit donation report." };
    }
    return await response.json();
  } catch (error: any) {
    console.error("Donation report failed:", error);
    return { success: false, message: error.message || "Connection error." };
  }
}

export async function getDonationReports(): Promise<DonationReport[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/donations`);
    if (!response.ok) {
      throw new Error("Failed to fetch donation reports.");
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch donation reports:", error);
    return [];
  }
}

export async function updateDonationStatus(
  id: string,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/donations/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const err = await response.json();
      return { success: false, message: err.error || "Failed to update donation status." };
    }
    return await response.json();
  } catch (error: any) {
    console.error("Donation status update failed:", error);
    return { success: false, message: error.message || "Connection error." };
  }
}
