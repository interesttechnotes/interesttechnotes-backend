import { google } from "googleapis";

// Read-only is enough for listing files
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

// Returns the latest `limit` files (newest modified first) that this
// shop's service account can see, i.e. files/folders shared with its email.
export const getLatestFiles = async (credentials, limit = 5) => {
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "trashed=false and mimeType != 'application/vnd.google-apps.folder'",
    orderBy: "modifiedTime desc",
    pageSize: limit,
    // Only non-sensitive fields: this data is shown on a public page
    fields: "files(id,name,mimeType,description,size,createdTime,modifiedTime)",
  });

  return (res.data.files || []).map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    url: `https://drive.google.com/uc?export=view&id=${file.id}`,
    amount: 10, // same placeholder price as before
    wholeFileObject: file,
  }));
};