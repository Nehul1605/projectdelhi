const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Path to store the last backup timestamp
const BACKUPS_DIR = path.join(__dirname, "..", "backups");
const TIMESTAMP_FILE = path.join(BACKUPS_DIR, "last-backup-timestamp.txt");
const INTERVAL_DAYS = 5;
const INTERVAL_MS = INTERVAL_DAYS * 24 * 60 * 60 * 1000;

// Reusable backup function similar to dbBackup.js but won't exit the process
async function runBackup() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.error("AutoBackup: No active database connection.");
      return false;
    }

    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      console.log("AutoBackup: No collections found to backup.");
      return false;
    }

    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(BACKUPS_DIR, `backup-auto-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    console.log(`AutoBackup: Starting automatic backup of collections to: ${backupDir}`);

    const EJSON = mongoose.mongo.BSON.EJSON;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith("system.")) continue;

      const documents = await db.collection(colName).find({}).toArray();
      const serializedData = EJSON.stringify(documents, null, 2);
      
      const filePath = path.join(backupDir, `${colName}.json`);
      fs.writeFileSync(filePath, serializedData, "utf8");
    }

    // Update 'latest' reference
    const latestDir = path.join(BACKUPS_DIR, "latest");
    if (fs.existsSync(latestDir)) {
      fs.rmSync(latestDir, { recursive: true, force: true });
    }
    fs.mkdirSync(latestDir, { recursive: true });
    
    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      fs.copyFileSync(path.join(backupDir, file), path.join(latestDir, file));
    }

    console.log("AutoBackup: Automatic backup completed successfully!");
    
    // Write new timestamp
    fs.writeFileSync(TIMESTAMP_FILE, Date.now().toString(), "utf8");
    return true;
  } catch (error) {
    console.error("AutoBackup failed:", error);
    return false;
  }
}

async function checkAndRunBackup() {
  console.log("AutoBackup: Checking if automatic backup is due...");
  
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  let shouldBackup = false;

  if (!fs.existsSync(TIMESTAMP_FILE)) {
    console.log("AutoBackup: No previous backup timestamp found. Creating initial backup...");
    shouldBackup = true;
  } else {
    try {
      const lastBackupStr = fs.readFileSync(TIMESTAMP_FILE, "utf8").trim();
      const lastBackupTime = parseInt(lastBackupStr, 10);
      
      if (isNaN(lastBackupTime)) {
        shouldBackup = true;
      } else {
        const diff = Date.now() - lastBackupTime;
        const daysSince = diff / (24 * 60 * 60 * 1000);
        console.log(`AutoBackup: Last backup was ${daysSince.toFixed(2)} days ago.`);
        if (diff >= INTERVAL_MS) {
          shouldBackup = true;
        }
      }
    } catch (e) {
      console.error("AutoBackup: Error reading timestamp file, defaulting to run backup:", e);
      shouldBackup = true;
    }
  }

  if (shouldBackup) {
    await runBackup();
  } else {
    console.log("AutoBackup: Backup is not due yet.");
  }
}

function startAutoBackupScheduler() {
  // Run check on startup (once connection is established)
  checkAndRunBackup();

  // Check every 6 hours (21600000 ms) so that we catch the 5-day boundary even if server runs constantly
  const CHECK_INTERVAL = 6 * 60 * 60 * 1000; 
  setInterval(() => {
    checkAndRunBackup();
  }, CHECK_INTERVAL);
}

module.exports = startAutoBackupScheduler;
