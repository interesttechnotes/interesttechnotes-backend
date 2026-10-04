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
// Replace the existing sendFolderShareEmail in services/email.service.js
// with this one. `resend` is already defined at the top of that file.

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const sendFolderShareEmail = async (
  email,
  fileId,
  fileName = "your file",
) => {
  // /open?id= works for both files and folders
  const link = `https://drive.google.com/open?id=${fileId}`;

  // Resend's SDK does NOT throw on API errors. It returns { data, error },
  // so the error has to be checked explicitly.
  const { data, error } = await resend.emails.send({
    from: process.env.DOMAIN_EMAIL, // e.g. "Interest Tech Notes <noreply@yourdomain.com>"
    to: email,
    subject: `Access granted: ${fileName}`,
    html: `
      <h2>Access granted</h2>
      <p>Thanks for your purchase. You now have access to <b>${escapeHtml(fileName)}</b> on Google Drive.</p>
      <p>
        <a href="${link}"
           style="background:#4f46e5;color:white;padding:10px 16px;
           text-decoration:none;border-radius:6px;">
          Open in Google Drive
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link:</p>
      <p>${link}</p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message || "Resend failed to send email");
  }

  console.log("Share email sent, id:", data?.id);
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
export const sendContactThankYouEmail = async (name, email, message) => {
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
