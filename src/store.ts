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

// Seed data for demonstration
const SEED_TASKS: TaskRequest[] = [
  {
    id: "seed-1",
    title: "Yamuna Ghat Cleanup Drive",
    description:
      "Join us for a massive cleanup drive along the Yamuna Ghat near ITO. We aim to collect and properly dispose of plastic waste, clean the riverbank area, and spread awareness about river pollution. All cleaning supplies will be provided. Let's restore the beauty of our beloved Yamuna together!",
    category: "cleanup",
    applicantType: "group",
    applicantName: "Rahul Sharma",
    organizationName: "Delhi Green Warriors",
    email: "delhigreenwarriors@gmail.com",
    phone: "9876543210",
    address: "Yamuna Ghat, near ITO Bridge",
    locality: "ITO",
    city: "New Delhi",
    pincode: "110002",
    eventDate: "2026-06-15",
    eventTime: "07:00",
    volunteersNeeded: 50,
    status: "approved",
    createdAt: "2026-05-20T10:00:00Z",
    volunteers: [
      {
        id: "v1",
        name: "Anita Verma",
        email: "anita@test.com",
        phone: "9898989898",
        joinedAt: "2026-05-21T08:00:00Z",
        message: "Excited to help clean our river!",
      },
      {
        id: "v2",
        name: "Karan Singh",
        email: "karan@test.com",
        phone: "9797979797",
        joinedAt: "2026-05-21T09:30:00Z",
      },
      {
        id: "v3",
        name: "Priya Mehta",
        email: "priya@test.com",
        phone: "9696969696",
        joinedAt: "2026-05-21T11:00:00Z",
        message: "Count me in! Will bring 5 more friends.",
      },
    ],
  },
  {
    id: "seed-2",
    title: "Plant 1000 Trees in Dwarka",
    description:
      "Our goal is to plant 1000 saplings across Dwarka Sector 21-23 public parks and roadside areas. Native species like Neem, Peepal, and Ashoka will be planted. Saplings and tools will be provided. Help us make Dwarka greener and fight Delhi's air pollution!",
    category: "plantation",
    applicantType: "group",
    applicantName: "Meena Gupta",
    organizationName: "Breathe Delhi Foundation",
    email: "breathedelhi@gmail.com",
    phone: "9123456780",
    address: "Sector 22 Community Park, Dwarka",
    locality: "Dwarka",
    city: "New Delhi",
    pincode: "110077",
    eventDate: "2026-07-01",
    eventTime: "06:30",
    volunteersNeeded: 100,
    status: "approved",
    createdAt: "2026-05-18T14:00:00Z",
    volunteers: [
      {
        id: "v4",
        name: "Vikram Joshi",
        email: "vikram@test.com",
        phone: "9595959595",
        joinedAt: "2026-05-19T07:00:00Z",
        message: "Let's make Delhi green again!",
      },
      {
        id: "v5",
        name: "Sonal Agarwal",
        email: "sonal@test.com",
        phone: "9494949494",
        joinedAt: "2026-05-19T10:00:00Z",
      },
    ],
  },
  {
    id: "seed-3",
    title: "Free Health Checkup Camp - Chandni Chowk",
    description:
      "Organizing a free health checkup camp for the residents of Chandni Chowk area. Services include blood pressure check, sugar level testing, basic eye examination, and free medicine distribution. We need volunteers to help with crowd management, registration, and assisting doctors.",
    category: "healthcare",
    applicantType: "individual",
    applicantName: "Dr. Amit Khanna",
    email: "dramitkhanna@gmail.com",
    phone: "9234567890",
    address: "Town Hall, Chandni Chowk",
    locality: "Chandni Chowk",
    city: "Old Delhi",
    pincode: "110006",
    eventDate: "2026-06-20",
    eventTime: "09:00",
    volunteersNeeded: 30,
    status: "approved",
    createdAt: "2026-05-19T08:00:00Z",
    volunteers: [
      {
        id: "v6",
        name: "Neha Kapoor",
        email: "neha@test.com",
        phone: "9393939393",
        joinedAt: "2026-05-20T12:00:00Z",
        message: "Medical student - happy to assist!",
      },
    ],
  },
  {
    id: "seed-4",
    title: "Weekend Literacy Camp for Street Children",
    description:
      "We run weekend classes for street children near Sarai Kale Khan. Looking for volunteers who can teach basic English, Hindi, and Mathematics. No prior teaching experience needed — just passion and patience. Stationery and refreshments for kids will be arranged.",
    category: "education",
    applicantType: "individual",
    applicantName: "Sneha Tiwari",
    email: "sneha.teaches@gmail.com",
    phone: "9345678901",
    address: "Under-flyover Community Space, Sarai Kale Khan",
    locality: "Sarai Kale Khan",
    city: "New Delhi",
    pincode: "110013",
    eventDate: "2026-06-08",
    eventTime: "10:00",
    volunteersNeeded: 15,
    status: "approved",
    createdAt: "2026-05-17T16:00:00Z",
    volunteers: [],
  },
  {
    id: "seed-5",
    title: "Food Distribution Drive - Nizamuddin Basti",
    description:
      "Monthly food distribution drive for underprivileged families in Nizamuddin Basti. We prepare and distribute 500+ meal packets. Need volunteers to help with cooking, packing, and distribution. Together we can ensure no one sleeps hungry.",
    category: "food-drive",
    applicantType: "group",
    applicantName: "Faizan Ahmed",
    organizationName: "Roti Foundation Delhi",
    email: "rotifoundation@gmail.com",
    phone: "9456789012",
    address: "Nizamuddin Basti, near Dargah",
    locality: "Nizamuddin",
    city: "New Delhi",
    pincode: "110013",
    eventDate: "2026-06-05",
    eventTime: "11:00",
    volunteersNeeded: 40,
    status: "approved",
    createdAt: "2026-05-16T12:00:00Z",
    volunteers: [
      {
        id: "v7",
        name: "Aisha Khan",
        email: "aisha@test.com",
        phone: "9292929292",
        joinedAt: "2026-05-17T09:00:00Z",
      },
      {
        id: "v8",
        name: "Rohit Pandey",
        email: "rohit@test.com",
        phone: "9191919191",
        joinedAt: "2026-05-17T14:00:00Z",
        message: "Will bring packaging materials!",
      },
      {
        id: "v9",
        name: "Tanvi Bhatt",
        email: "tanvi@test.com",
        phone: "9090909090",
        joinedAt: "2026-05-18T08:00:00Z",
      },
      {
        id: "v10",
        name: "Suresh Kumar",
        email: "suresh@test.com",
        phone: "8989898989",
        joinedAt: "2026-05-18T15:00:00Z",
        message: "Can contribute rice and dal supplies.",
      },
    ],
  },
  {
    id: "seed-6",
    title: "Stray Animal Feeding & Vaccination Camp",
    description:
      "Organizing a feeding and basic vaccination camp for stray dogs and cats in South Delhi. Partnering with local vets for anti-rabies vaccinations. Need volunteers who love animals to help with feeding, catching, and managing the camp. A compassionate heart is all you need!",
    category: "animal-welfare",
    applicantType: "group",
    applicantName: "Pooja Reddy",
    organizationName: "Paws of Delhi",
    email: "pawsofdelhi@gmail.com",
    phone: "9567890123",
    address: "Deer Park, Hauz Khas",
    locality: "Hauz Khas",
    city: "New Delhi",
    pincode: "110016",
    eventDate: "2026-06-12",
    eventTime: "08:00",
    volunteersNeeded: 20,
    status: "approved",
    createdAt: "2026-05-15T11:00:00Z",
    volunteers: [
      {
        id: "v11",
        name: "Arjun Nair",
        email: "arjun@test.com",
        phone: "8888888888",
        joinedAt: "2026-05-16T07:00:00Z",
        message: "Animal lover here! 🐶",
      },
    ],
  },
  {
    id: "seed-pending-1",
    title: "Cycle Rally for Clean Air",
    description:
      "Planning a cycle rally from India Gate to Connaught Place to spread awareness about air pollution in Delhi. Need volunteers to manage route, distribute masks, and capture the event.",
    category: "awareness",
    applicantType: "individual",
    applicantName: "Rohan Malik",
    email: "rohanmalik@gmail.com",
    phone: "9678901234",
    address: "India Gate Lawns",
    locality: "India Gate",
    city: "New Delhi",
    pincode: "110001",
    eventDate: "2026-06-25",
    eventTime: "06:00",
    volunteersNeeded: 25,
    status: "pending",
    createdAt: "2026-05-22T06:00:00Z",
    volunteers: [],
  },
  {
    id: "seed-verified-1",
    title: "Community Lake Restoration - Hauz Khas",
    description:
      "A weekend restoration drive to remove floating waste, set up litter traps, and install signage around Hauz Khas Lake. Seeking volunteers for cleanup and documentation. Municipal permissions are in place.",
    category: "cleanup",
    applicantType: "group",
    applicantName: "Nisha Rao",
    organizationName: "Blue Lake Collective",
    email: "bluelakecollective@gmail.com",
    phone: "9812345670",
    address: "Hauz Khas Lake, South Delhi",
    locality: "Hauz Khas",
    city: "New Delhi",
    pincode: "110016",
    eventDate: "2026-06-18",
    eventTime: "07:30",
    volunteersNeeded: 35,
    status: "verified",
    createdAt: "2026-05-23T09:00:00Z",
    volunteers: [],
  },
  {
    id: "seed-verified-2",
    title: "Street Art Wall for Civic Awareness",
    description:
      "Artists and volunteers will paint a public wall near Lajpat Nagar with civic messages on water conservation and cleanliness. We need 10 volunteers for setup, supplies, and crowd support.",
    category: "awareness",
    applicantType: "individual",
    applicantName: "Ishaan Mehra",
    email: "ishaan.mehra@gmail.com",
    phone: "9823456711",
    address: "Central Market, Lajpat Nagar",
    locality: "Lajpat Nagar",
    city: "New Delhi",
    pincode: "110024",
    eventDate: "2026-06-10",
    eventTime: "16:00",
    volunteersNeeded: 10,
    status: "verified",
    createdAt: "2026-05-24T12:30:00Z",
    volunteers: [],
  },
  {
    id: "seed-rejected-1",
    title: "Unverified Food Drive - No Permits",
    description:
      "A food distribution drive proposal missing location permissions and beneficiary details. Needs resubmission with proper documentation.",
    category: "food-drive",
    applicantType: "individual",
    applicantName: "Aman Singh",
    email: "amansingh@gmail.com",
    phone: "9876512340",
    address: "Unknown",
    locality: "Karol Bagh",
    city: "New Delhi",
    pincode: "110005",
    eventDate: "2026-06-02",
    eventTime: "18:00",
    volunteersNeeded: 20,
    status: "rejected",
    createdAt: "2026-05-21T17:00:00Z",
    volunteers: [],
  },
];

const SEED_VOLUNTEER_APPS: VolunteerApp[] = [
  {
    id: "vapp-seed-1",
    name: "Ritika Malhotra",
    email: "ritika.malhotra@gmail.com",
    phone: "9876501234",
    reason:
      "I have volunteered for community cleanups and want to help verify proposals responsibly.",
    status: "applied",
    createdAt: "2026-05-23T11:20:00Z",
  },
  {
    id: "vapp-seed-2",
    name: "Samar Gupta",
    email: "samar.gupta@gmail.com",
    phone: "9899001122",
    reason:
      "I lead a neighborhood NGO and can help screen initiatives quickly.",
    status: "interviewing",
    createdAt: "2026-05-24T09:45:00Z",
  },
  {
    id: "vapp-seed-3",
    name: "Farah Khan",
    email: "farah.khan@gmail.com",
    phone: "9811122233",
    reason: "I can support admin teams with outreach and moderation work.",
    status: "approved",
    createdAt: "2026-05-20T16:10:00Z",
  },
  {
    id: "vapp-seed-4",
    name: "Arnav Joshi",
    email: "arnav.joshi@gmail.com",
    phone: "9822003344",
    reason: "Interested in a moderator role but need guidance on the process.",
    status: "rejected",
    createdAt: "2026-05-19T13:05:00Z",
  },
];

function loadTasks(): TaskRequest[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load tasks from storage", e);
  }
  // First time — seed with demo data
  saveTasks(SEED_TASKS);
  return SEED_TASKS;
}

function saveTasks(tasks: TaskRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function getTasks(): TaskRequest[] {
  return loadTasks();
}

export function getApprovedTasks(): TaskRequest[] {
  return loadTasks().filter((t) => t.status === "approved");
}

export function getPendingTasks(): TaskRequest[] {
  return loadTasks().filter((t) => t.status === "pending");
}

export function getTaskById(id: string): TaskRequest | undefined {
  return loadTasks().find((t) => t.id === id);
}

export function addTask(
  task: Omit<TaskRequest, "id" | "status" | "createdAt" | "volunteers">,
): TaskRequest {
  const tasks = loadTasks();
  const newTask: TaskRequest = {
    ...task,
    id: "task-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    status: "pending",
    createdAt: new Date().toISOString(),
    volunteers: [],
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTaskStatus(id: string, status: TaskStatus): void {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    tasks[idx].status = status;
    saveTasks(tasks);
  }
}

export function addVolunteer(
  taskId: string,
  volunteer: Omit<Volunteer, "id" | "joinedAt">,
): boolean {
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return false;

  // Check duplicate email
  if (tasks[idx].volunteers.some((v) => v.email === volunteer.email)) {
    return false;
  }

  tasks[idx].volunteers.push({
    ...volunteer,
    id: "vol-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    joinedAt: new Date().toISOString(),
  });
  saveTasks(tasks);
  return true;
}

// --- Volunteer Applications ---

function loadVolunteerApps(): VolunteerApp[] {
  try {
    const stored = localStorage.getItem(VOLUNTEER_APPS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load volunteer apps", e);
  }
  saveVolunteerApps(SEED_VOLUNTEER_APPS);
  return SEED_VOLUNTEER_APPS;
}

function saveVolunteerApps(apps: VolunteerApp[]) {
  localStorage.setItem(VOLUNTEER_APPS_KEY, JSON.stringify(apps));
}

export function getVolunteerApps(): VolunteerApp[] {
  return loadVolunteerApps();
}

export function addVolunteerApp(
  app: Omit<VolunteerApp, "id" | "status" | "createdAt">,
): VolunteerApp {
  const apps = loadVolunteerApps();
  const newApp: VolunteerApp = {
    ...app,
    id: "vapp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    status: "applied",
    createdAt: new Date().toISOString(),
  };
  apps.push(newApp);
  saveVolunteerApps(apps);
  return newApp;
}

export function updateVolunteerAppStatus(
  id: string,
  status: ApplicationStatus,
): void {
  const apps = loadVolunteerApps();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx !== -1) {
    apps[idx].status = status;
    saveVolunteerApps(apps);
  }
}

// --- Auth & RBAC ---

export function getRegisteredRole(email: string): Role {
  try {
    const storedUsers = localStorage.getItem(REGISTERED_EMAILS_KEY);
    if (storedUsers) {
      const users: Record<string, Role> = JSON.parse(storedUsers);
      if (users[email]) return users[email];
    }
  } catch (e) {}

  // Defaults based on mock emails
  if (email === "admin@delhi.com") return "ADMIN";
  if (email === "moderator@delhi.com") return "MODERATOR";
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
  const user: CurrentUser = { email, name, role };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function userLogout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getVerifiedTasks(): TaskRequest[] {
  return loadTasks().filter((t) => t.status === "verified");
}

export function resetToSeedData(): void {
  saveTasks(SEED_TASKS);
}

export function getStats() {
  const tasks = loadTasks();
  const approved = tasks.filter((t) => t.status === "approved");
  const totalVolunteers = approved.reduce(
    (sum, t) => sum + t.volunteers.length,
    0,
  );
  return {
    totalTasks: approved.length,
    totalVolunteers,
    totalPending: tasks.filter((t) => t.status === "pending").length,
    localities: [...new Set(approved.map((t) => t.locality))].length,
  };
}
