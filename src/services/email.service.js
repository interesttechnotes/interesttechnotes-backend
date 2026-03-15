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
            subject: `Your OTP Code is ${otp} expire in 5 min`,
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
        console.log("--cuntom-mail-share-folder--");
        
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
/* ==============================
   ✅ CONTACT US EMAIL
================================= */
export const sendContactEmail = async (name, email, message) => {
    try {
        console.log("--contact-us-mail--");

        const response = await resend.emails.send({
            from: process.env.DOMAIN_EMAIL,
            to: process.env.CONTACT_RECEIVER_EMAIL, // your admin email
            subject: `New Contact Message from ${name}`,
            html: `
        <h2>📩 New Contact Form Submission</h2>

        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Message:</strong></p>
        <p style="background:#f4f4f4;padding:10px;border-radius:6px;">
          ${message}
        </p>

        <hr/>

        <p style="font-size:12px;color:#777;">
          This message was sent from your website contact form.
        </p>
      `,
        });

        console.log("Contact Email sent:", response);
    } catch (error) {
        console.error("Contact Email Error:", error);
        throw error;
    }
    
};


/* ==============================
   ✅ THANK YOU EMAIL TO USER
================================= */
export const sendContactThankYouEmail = async (name, email,message) => {
  try {
    const response = await resend.emails.send({
    //   from: process.env.DOMAIN_EMAIL,
      from: "ak@slvai.tech",
      to: email,
      subject: "Thanks for contacting us!",
      html: `
        <h2>🙏 Thank You for Contacting Us</h2>

        <p>Hello ${name},</p>
        <p>this is about your message - ${message},</p>

        <p>
          Thank you for reaching out. We have received your message and
          our team will get back to you as soon as possible.
        </p>

        <p>Best regards,<br/>Interest Tech Team</p>
      `,
    });

    console.log("User Thank You Email sent:", response);
  } catch (error) {
    console.error("User Thank You Email Error:", error);
    throw error;
  }
};