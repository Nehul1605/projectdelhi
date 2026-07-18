const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const readline = require("readline");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI is not defined in your environment variables.");
  process.exit(1);
}

// Helper to ask user for confirmation in console
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => rl.question(query, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

async function restore() {
  // Check backups directory
  const backupsDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupsDir)) {
    console.error("Error: No backups directory found. Run backup script first.");
    process.exit(1);
  }

  // List all backup directories
  const files = fs.readdirSync(backupsDir);
  const backupFolders = files.filter(file => {
    const filePath = path.join(backupsDir, file);
    return fs.statSync(filePath).isDirectory() && file !== "latest";
  }).sort(); // Sort so newest is usually last

  if (backupFolders.length === 0) {
    console.error("Error: No backup folders found in " + backupsDir);
    process.exit(1);
  }

  console.log("\nAvailable backups:");
  backupFolders.forEach((folder, index) => {
    console.log(`[${index + 1}] ${folder}`);
  });
  console.log(`[${backupFolders.length + 1}] latest (Copy of last backup)`);

  const choiceInput = await askQuestion(`\nSelect a backup to restore (1-${backupFolders.length + 1}): `);
  const choiceIndex = parseInt(choiceInput, 10) - 1;

  let selectedFolder = "";
  if (choiceIndex >= 0 && choiceIndex < backupFolders.length) {
    selectedFolder = backupFolders[choiceIndex];
  } else if (choiceIndex === backupFolders.length) {
    selectedFolder = "latest";
  } else {
    console.log("Invalid choice. Exiting.");
    process.exit(1);
  }

  const targetBackupDir = path.join(backupsDir, selectedFolder);
  console.log(`\nSelected backup path: ${targetBackupDir}`);

  // Confirm before dropping database or collections
  const confirmation = await askQuestion(
    "\nWARNING: Restoring will overwrite existing collections and data. Type \"RESTORE\" to confirm: "
  );

  if (confirmation !== "RESTORE") {
    console.log("Restore cancelled.");
    process.exit(0);
  }

  let success = true;
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;
    const EJSON = mongoose.mongo.BSON.EJSON;

    // Read json files in the backup directory
    const backupFiles = fs.readdirSync(targetBackupDir).filter(file => file.endsWith(".json"));

    if (backupFiles.length === 0) {
      console.log("No backup JSON files found in the folder.");
      success = false;
    } else {
      for (const file of backupFiles) {
        const colName = file.replace(".json", "");
        const filePath = path.join(targetBackupDir, file);
        
        console.log(`\nRestoring collection: ${colName}...`);
        const fileData = fs.readFileSync(filePath, "utf8");
        
        // Parse EJSON to preserve types
        const documents = EJSON.parse(fileData);

        // Drop existing collection to start clean
        const collections = await db.listCollections({ name: colName }).toArray();
        if (collections.length > 0) {
          console.log(`Dropping existing collection: ${colName}...`);
          await db.collection(colName).drop();
        }

        if (documents.length > 0) {
          console.log(`Inserting ${documents.length} documents into ${colName}...`);
          await db.collection(colName).insertMany(documents);
        } else {
          // Just recreate the collection if it was empty
          console.log(`Recreating empty collection: ${colName}...`);
          await db.createCollection(colName);
        }
        console.log(`Collection ${colName} restored successfully.`);
      }

      console.log("\nRestore completed successfully!");
    }
  } catch (error) {
    console.error("Restore failed:", error);
    success = false;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
  process.exit(success ? 0 : 1);
}

restore();
