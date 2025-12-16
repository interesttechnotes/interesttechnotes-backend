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

// export const getFileById = async (fileId) => {
//     const drive = getDriveClient();

//     const response = await drive.files.get({
//         fileId,
//         // fields: "id, name, mimeType",
//         fields: "files(id,name,mimeType,description,size,createdTime,modifiedTime,viewedByMeTime,owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress),permissions(type,role,emailAddress),shared,parents,quotaBytesUsed)"

//     });

//     return {
//         id: response.data.id,
//         name: response.data.name,
//         url: `https://drive.google.com/uc?export=view&id=${response.data.id}`,
//     };
// };
export const getFileById = async (fileId) => {
    try {
        const drive = getDriveClient();

        const response = await drive.files.get({
            fileId,
            fields:
                "id,name,mimeType,description,size,createdTime,modifiedTime,viewedByMeTime,owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress),permissions(type,role,emailAddress),shared,parents,quotaBytesUsed",
        });

        const file = response.data;

        return {
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            description: file.description, // ⭐ IMPORTANT
            url: `https://drive.google.com/uc?export=view&id=${file.id}`,
            amount: 10,                     // ⭐ fallback price
            wholeFileObject: file,
            actualResData: response.data,
        };
    } catch (err) {
        console.error("Error fetching file by ID:", err.message);
        return null;
    }
};
