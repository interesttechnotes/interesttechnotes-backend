import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email, otp) => {
    //   const transporter = nodemailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //       user: process.env.EMAIL_USER,
    //       pass: process.env.EMAIL_PASS, // App password
    //     },
    //   });
    // const transporter = nodemailer.createTransport({
    //     host: process.env.SMTP_HOST,
    //     port: process.env.SMTP_PORT,
    //     secure: false, // true for 465, false for other ports
    //     auth: {
    //         user: process.env.EMAIL_USER,     // Your email
    //         pass: process.env.EMAIL_PASS, // Your email password or app password
    //     },
    // });
    // console.log("--send mail to--", email);

    // await transporter.sendMail({
    //     from: process.env.EMAIL_USER,
    //     to: email,
    //     subject: "Your OTP Code",
    //     html: `
    //   <h2>Your OTP Code</h2>
    //   <p>Your OTP is:</p>
    //   <h1>${otp}</h1>
    //   <p>This OTP will expire in 5 minutes.</p>
    // `,
    // });
    try {
        const response = await resend.emails.send({
            from: process.env.DOMAIN_EMAIL, // temporary test sender
            to: email,
            subject: "Your OTP Code",
            html: `
        <h2>Your OTP Code</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 5 minutes.</p>
      `,
        });

        console.log("Email sent:", response);
    } catch (error) {
        console.error("Resend Error:", error);
        throw error;
    }
};


/* ==============================
   ✅ FOLDER SHARE EMAIL
================================= */
export const sendFolderShareEmail = async (email, folderId) => {
    try {
        const folderLink = `https://drive.google.com/drive/folders/${folderId}`;

        const response = await resend.emails.send({
            from: process.env.DOMAIN_EMAIL,
            to: email,
            subject: "A Folder Has Been Shared With You",
            html: `
        <h2>📁 Folder Access Granted</h2>
        <p>You have been granted access to a Google Drive folder.</p>
        
        <p>
          <a href="${folderLink}" 
             style="background:#4f46e5;color:white;padding:10px 16px;
             text-decoration:none;border-radius:6px;">
            Open Folder
          </a>
        </p>

        <p>If the button doesn't work, copy and paste this link:</p>
        <p>${folderLink}</p>
      `,
        });

        console.log("Folder Share Email sent:", response);
    } catch (error) {
        console.error("Resend Folder Email Error:", error);
        throw error;
    }
};