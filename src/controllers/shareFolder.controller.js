import { google } from "googleapis";
import { sendFolderShareEmail } from "../services/email.service.js";

// Sharing needs write access to permissions, so the full Drive scope is used
const SCOPES = ["https://www.googleapis.com/auth/drive"];

/**
 * Shares a Drive file/folder with a user, using the credentials of the SHOP
 * that owns it (not a single global service-account.json).
 *
 * @param {object} credentials - the shop's service-account JSON (parsed object)
 * @param {string} fileId      - Drive file or folder id
 * @param {string} email       - buyer's email
 * @param {string} [fileName]  - used in the custom email
 */
export const shareFolderWithUser = async (
  credentials,
  fileId,
  email,
  fileName,
) => {
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const drive = google.drive({ version: "v3", auth });

  // 1) Grant access. If this fails the whole share failed, so we throw.
  try {
    console.log(`📁 Sharing ${fileId} with ${email}`);

    await drive.permissions.create({
      fileId,
      requestBody: { type: "user", role: "reader", emailAddress: email },
      sendNotificationEmail: true, // Google's own invite email
      emailMessage: "Thanks for your purchase. Your file is ready to view.",
    });

    console.log("✅ Drive permission created");
  } catch (err) {
    const reasons = (err.errors || []).map((e) => e.reason).join(", ");
    console.error(
      `❌ Drive share failed (file ${fileId}, ${email}): ${err.message} ${reasons}`,
    );
    if (err.code === 404) {
      console.error("   → This shop's service account can't see the file.");
    } else if (err.code === 403) {
      console.error(
        "   → Service account needs Editor access to the file/folder.",
      );
    }
    throw new Error(`Failed to share ${fileId}: ${err.message}`);
  }

  // 2) Custom email via Resend. The share already worked, so a failure here
  //    is logged but never reported as "share failed".
  try {
    await sendFolderShareEmail(email, fileId, fileName);
  } catch (err) {
    console.warn("⚠️ Custom share email failed:", err.message);
  }
};
