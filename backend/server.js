require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const appRoutes = require("./routes/appRoutes");

// Import models for seeding
const User = require("./models/User");
const Task = require("./models/Task");
const VolunteerApp = require("./models/VolunteerApp");
const Subscriber = require("./models/Subscriber");
const GeneralVolunteer = require("./models/GeneralVolunteer");
const Donation = require("./models/Donation");
const GeneralPartner = require("./models/GeneralPartner");
const Activity = require("./models/Activity");
const DeletedTask = require("./models/DeletedTask");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Connect Database
connectDB().then(() => {
  seedUsersIfNeeded();
  // Start automatic backups (every 5 days)
  const startAutoBackupScheduler = require("./utils/autoBackup");
  startAutoBackupScheduler();
});

// Seed Core Team Members
async function seedUsersIfNeeded() {
  try {
    const coreUsers = [
      { email: "admin@projectdelhi.org", name: "Admin", role: "ADMIN", password: "delhi123" },
      { email: "rahul@projectdelhi.org", name: "Rahul", role: "MODERATOR", password: "rahul123" },
      { email: "priya@projectdelhi.org", name: "Priya", role: "MODERATOR", password: "delhi123" },
      { email: "raghav@projectdelhi.org", name: "Raghav", role: "MODERATOR", password: "delhi123" }
    ];
    for (const u of coreUsers) {
      await User.findOneAndUpdate(
        { email: u.email.toLowerCase() },
        u,
        { upsert: true, new: true }
      );
    }
    console.log("Successfully synchronized core team users in MongoDB.");
  } catch (err) {
    console.error("Error seeding core team users:", err.message);
  }
}

// Simple health check route for external ping services to keep the backend awake
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Attach Routes
app.use("/api", authRoutes);
app.use("/api", taskRoutes);
app.use("/api", appRoutes);

// Database Reset Route
app.post("/api/reset", async (req, res) => {
  try {
    await Task.deleteMany({});
    await VolunteerApp.deleteMany({});
    await Subscriber.deleteMany({});
    await GeneralVolunteer.deleteMany({});
    await GeneralPartner.deleteMany({});
    await Donation.deleteMany({});
    await Activity.deleteMany({});
    await DeletedTask.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
