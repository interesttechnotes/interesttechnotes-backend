import { getFilesInFolder } from "../utils/googleDrive.js";

const GOOGLE_FOLDER_ID = "1SHN12xKwUCR82b3F1Qk1dkW6hv8TkeNW"; // your main drive folder

export const getDriveFiles = async (req, res) => {
  try {
    const files = await getFilesInFolder(GOOGLE_FOLDER_ID);

    return res.json({
      message: "Files fetched from Google Drive",
      files,
    });
  } catch (err) {
    console.error("Get Drive Files Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
