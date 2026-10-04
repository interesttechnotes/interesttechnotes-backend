import {
    //   sendContactEmailToAdmin,
    sendContactThankYouEmail,
} from "../services/email.service.js";

export const contactUs = async (req, res) => {
    try {
        console.log("Contact route hit");

        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        await sendContactThankYouEmail(name, email, message);

        return res.status(200).json({
            success: true,
            message: "Message sent successfully",
        });

    } catch (error) {
        console.error("Contact Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
};