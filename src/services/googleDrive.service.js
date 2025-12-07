import { google } from "googleapis";
import path from "path";
import fs from "fs";

const KEYFILEPATH = path.resolve("service-account.json");
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const getDriveClient = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
  return google.drive({ version: "v3", auth });
};

export const getFileById = async (fileId) => {
  const drive = getDriveClient();

  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType",
  });

  return {
    id: response.data.id,
    name: response.data.name,
    url: `https://drive.google.com/uc?export=view&id=${response.data.id}`,
  };
};
