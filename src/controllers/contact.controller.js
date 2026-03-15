import {
//   sendContactEmailToAdmin,
  sendContactThankYouEmail,
} from "../services/email.service.js";

export const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // send message to admin
    // await sendContactEmailToAdmin(name, email, message);

    // send thank you mail to user
    await sendContactThankYouEmail(name, email,message);

    res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({
      message: "Failed to send message",
    });
  }
};