import { google } from "googleapis";
import path from "path";
import fs from "fs";

const KEYFILEPATH = path.resolve("service-account.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

/**
 * Shares a Google Drive folder with a specified user.
 * @param {string} folderId - The Google Drive folder ID.
 * @param {string} email - The email of the user to share with.
 */
export const shareFolderWithUser = async (folderId, email) => {
  try {
    // 🔍 Check if key file exists
    if (!fs.existsSync(KEYFILEPATH)) {
      throw new Error(`Missing service account key file: ${KEYFILEPATH}`);
    }

    // 🔐 Authenticate
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
    });

    const drive = google.drive({ version: "v3", auth });

    console.log(`📁 Attempting to share folder: ${folderId} with ${email}`);

    // 🧩 Try sharing the folder
    const response = await drive.permissions.create({
      fileId: folderId,
      resource: {
        type: "user",
        role: "reader", // or "writer"
        emailAddress: email,
      },
      sendNotificationEmail: true,
    });

    console.log(`✅ Folder shared successfully!`);
    console.log(`📤 Google API Response:`, JSON.stringify(response.data, null, 2));

  } catch (err) {
    // 🧠 Handle common Google Drive API errors more clearly
    console.error("❌ Error sharing folder:");
    console.error(`   → Message: ${err.message}`);
    console.error(`   → Folder ID: ${folderId}`);
    console.error(`   → Email: ${email}`);

    if (err.errors && Array.isArray(err.errors)) {
      for (const e of err.errors) {
        console.error(`   → Google Error: [${e.reason}] ${e.message}`);
      }
    }

    if (err.code === 404) {
      console.error("🚫 File not found — check if the service account has access to the folder.");
    } else if (err.code === 403) {
      console.error("🔒 Permission denied — verify the service account has at least 'Editor' access.");
    } else if (err.code === 400) {
      console.error("⚠️ Bad request — check folderId or email formatting.");
    }

    // You can throw a more descriptive error for upstream handling
    throw new Error(
      `Failed to share folder (${folderId}) with ${email}: ${err.message}`
    );
  }
};
