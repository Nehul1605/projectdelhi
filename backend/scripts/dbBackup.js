const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in your environment variables.");
  process.exit(1);
}

async function backup() {
  let success = true;
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log("No collections found in the database to backup.");
      await mongoose.disconnect();
      return;
    }

    // Create a backups directory
    const backupsBaseDir = path.join(__dirname, "..", "backups");
    if (!fs.existsSync(backupsBaseDir)) {
      fs.mkdirSync(backupsBaseDir, { recursive: true });
    }

    // Create a backup directory with a timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(backupsBaseDir, `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    console.log("Starting backup of collections to: " + backupDir);

    const EJSON = mongoose.mongo.BSON.EJSON;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      // Skip system collections
      if (colName.startsWith("system.")) continue;

      console.log(`Backing up collection: ${colName}...`);
      const documents = await db.collection(colName).find({}).toArray();
      
      // Serialize documents to EJSON to preserve types (ObjectIds, Dates, etc.)
      const serializedData = EJSON.stringify(documents, null, 2);
      
      const filePath = path.join(backupDir, `${colName}.json`);
      fs.writeFileSync(filePath, serializedData, "utf8");
      console.log(`Saved ${documents.length} documents to ${colName}.json`);
    }

    // Create or update 'latest' directory containing a copy of this backup for easy restore
    const latestDir = path.join(backupsBaseDir, "latest");
    if (fs.existsSync(latestDir)) {
      fs.rmSync(latestDir, { recursive: true, force: true });
    }
    fs.mkdirSync(latestDir, { recursive: true });
    
    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      fs.copyFileSync(path.join(backupDir, file), path.join(latestDir, file));
    }
    console.log("Updated 'latest' backup reference at: " + latestDir);

    console.log("\nBackup completed successfully!");
  } catch (error) {
    console.error("Backup failed:", error);
    success = false;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
  process.exit(success ? 0 : 1);
}

backup();
