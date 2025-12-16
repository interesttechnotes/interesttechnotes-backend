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

export const getFilesInFolder = async (folderId) => {
    try {
        console.log("getFilesInFolder", folderId);

        const drive = getDriveClient();

        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            // fields: "files(id, name, mimeType,description,)"
            fields: "files(id,name,mimeType,description,size,createdTime,modifiedTime,viewedByMeTime,owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress),permissions(type,role,emailAddress),shared,parents,quotaBytesUsed)"

            
        });

        const files = res.data.files || [];

        
        // return clean payload
        return files.map(file => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            url: `https://drive.google.com/uc?export=view&id=${file.id}`,
            amount: 10,               // ⭐ your custom field
            wholeFileObject: file,
            actualResData: res.data
        }));

    } catch (err) {
        console.error("Error fetching files:", err.message);
        return [];
    }
};

// import { google } from "googleapis";
// import path from "path";
// import fs from "fs";

// const KEYFILEPATH = path.resolve("service-account.json");
// const SCOPES = ["https://www.googleapis.com/auth/drive"];

// const getDriveClient = () => {
//   const auth = new google.auth.GoogleAuth({
//     keyFile: KEYFILEPATH,
//     scopes: SCOPES,
//   });
//   return google.drive({ version: "v3", auth });
// };

// /**
//  * Fetch all file URLs inside a Google Drive folder
//  * @param {string} folderId 
//  * @returns {Promise<{id: string, name: string, url: string}[]>}
//  */
// export const getFilesInFolder = async (folderId) => {
//   try {
//     const drive = getDriveClient();

//     const res = await drive.files.list({
//       q: `'${folderId}' in parents and trashed=false`,
//       fields: "files(id, name, mimeType)",
//     });

//     const files = res.data.files || [];

//     // Return detailed file data
//     return files.map((file) => ({
//       id: file.id,
//       name: file.name,
//       mimeType: file.mimeType,
//       url: `https://drive.google.com/uc?export=view&id=${file.id}`,
//     }));

//   } catch (err) {
//     console.error("❌ Error fetching files in folder:", folderId, err.message);
//     return [];
//   }
// };

// // import { google } from "googleapis";
// // import path from "path";
// // import fs from "fs";

// // const KEYFILEPATH = path.resolve("service-account.json");
// // const SCOPES = ["https://www.googleapis.com/auth/drive"];

// // const getDriveClient = () => {
// //   const auth = new google.auth.GoogleAuth({
// //     keyFile: KEYFILEPATH,
// //     scopes: SCOPES,
// //   });
// //   return google.drive({ version: "v3", auth });
// // };

// // /**
// //  * Fetch all file URLs inside a Google Drive folder
// //  * @param {string} folderId 
// //  * @returns {Promise<string[]>} Array of public file URLs
// //  */
// // export const getFilesInFolder = async (folderId) => {
// //   try {
// //     const drive = getDriveClient();

// //     // List files
// //     const res = await drive.files.list({
// //       q: `'${folderId}' in parents and trashed=false`,
// //       fields: "files(id, name, mimeType)"
// //     });

// //     const files = res.data.files || [];

// //     // Generate shareable URLs
// //     const fileUrls = files.map((file) => {
// //       return `https://drive.google.com/uc?id=${file.id}`;
// //     });

// //     return fileUrls;

// //   } catch (err) {
// //     console.error("❌ Error fetching files from folder", folderId, err.message);
// //     return [];
// //   }
// // };


// // // import { google } from "googleapis";
// // // import path from "path";
// // // import fs from "fs";

// // // const KEYFILEPATH = path.resolve("service-account.json");
// // // const SCOPES = ["https://www.googleapis.com/auth/drive"];

// // // if (!fs.existsSync(KEYFILEPATH)) {
// // //   throw new Error("Missing service-account.json file");
// // // }

// // // const auth = new google.auth.GoogleAuth({
// // //   keyFile: KEYFILEPATH,
// // //   scopes: SCOPES,
// // // });

// // // const drive = google.drive({ version: "v3", auth });

// // // /**
// // //  * List all files inside a Google Drive folder
// // //  */
// // // export const listFilesInFolder = async (folderId) => {
// // //   try {
// // //     const response = await drive.files.list({
// // //       q: `'${folderId}' in parents and trashed=false`,
// // //       fields: "files(id, name, mimeType)",
// // //     });

// // //     return response.data.files;
// // //   } catch (err) {
// // //     console.error("Error listing folder files:", err);
// // //     return [];
// // //   }
// // // };

// // // /**
// // //  * Generate a public URL for file
// // //  */
// // // export const generatePublicUrl = (fileId) => {
// // //   return `https://drive.google.com/uc?export=view&id=${fileId}`;
// // // };
