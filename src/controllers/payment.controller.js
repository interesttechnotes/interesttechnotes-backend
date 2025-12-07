import Razorpay from "razorpay";
import crypto from "crypto";
import { Product } from "../models/Product.model.js";
import { Order } from "../models/Order.model.js";
import { User } from "../models/User.model.js";
import { shareFolderWithUser } from "./shareFolder.controller.js";
import { getFilesInFolder } from "../utils/googleDrive.js";
import { getFileById } from "../services/googleDrive.service.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    console.log("Incoming productId:", productId, "User:", req.user);

    // 1️⃣ Fetch file from Google Drive
    const file = await getFileById(productId);

    console.log("Google Drive File:", file);

    if (!file) {
      return res.status(404).json({ message: "File not found in Google Drive" });
    }

    // 2️⃣ File Price (static for now)
    const amount = 10; // ₹10

    // 3️⃣ Create Razorpay Order
    const options = {
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        fileId: file.id,
        fileName: file.name,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 4️⃣ Save order in MongoDB
    const newOrder = await Order.create({
      user: userId,
      file: {
        id: file.id,
        name: file.name,
        url: file.url,
      },
      amount,
      paymentMethod: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      orderStatus: "pending",
      isPaid: false,
    });

    // 5️⃣ Respond with Razorpay order + db orderId
    res.status(201).json({
      message: "Razorpay order created successfully",
      razorpayOrder,
      orderId: newOrder._id,
      fileName: file.name,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      fileUrl: file.url,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // 1️⃣ Verify Razorpay Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Razorpay signature ❌" });
    }

    // 2️⃣ Update order as paid
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        isPaid: true,
        orderStatus: "completed",
        paymentInfo: {
          id: razorpay_payment_id,
          status: "paid",
          paidAt: new Date(),
        },
      },
      { new: true }
    ).populate("user");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 3️⃣ Auto-share Google Drive file with user (optional)
    const fileId = updatedOrder.file?.id;
    const userEmail = updatedOrder.user?.email;

    if (fileId && userEmail) {
      try {
        await shareFolderWithUser(fileId, userEmail);
        console.log(`✅ File shared: ${fileId} with ${userEmail}`);
      } catch (shareError) {
        console.warn("⚠️ Google Drive share failed:", shareError.message);
      }
    } else {
      console.warn("⚠️ Missing fileId or userEmail — skipping Google Drive share");
    }

    // 4️⃣ Response
    return res.json({
      success: true,
      message: "Payment verified successfully ✅",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Verify Payment Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


// export const createOrder = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { productId } = req.body;

//     if (!productId) {
//       return res.status(400).json({ message: "productId is required" });
//     }
// console.log("getFileById(productId)", productId,req.user);

// // 🔥 Fetch file details from Google Drive
// const file = await getFileById(productId);

// console.log("getFileById(productId) - file", file);
//     if (!file) {
//       return res.status(404).json({ message: "File not found in Google Drive" });
//     }

//     // 🔥 Assign price (static or logic later)
//     const amount = 10;

//     // 🧾 Create order
//     const order = await Order.create({
//       user: userId,
//       file: {
//         id: file.id,
//         name: file.name,
//         url: file.url,
//       },
//       amount,
//       paymentMethod: "razorpay",
//       orderStatus: "pending",
//       isPaid: false,
//     });

//     res.status(201).json({
//       message: "Order created successfully",
//       order,
//     });
//   } catch (error) {
//     console.error("Create order error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };



// export const verifyPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({ message: "Invalid signature" });
//     }

//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       {
//         isPaid: true,
//         orderStatus: "completed",
//         paymentInfo: {
//           id: razorpay_payment_id,
//           status: "paid",
//           paidAt: new Date(),
//         },
//       },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       message: "Payment verified successfully",
//       order: updatedOrder,
//     });

//   } catch (error) {
//     console.error("Verify error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };


// ✅ Create Razorpay Order
// export const createOrder = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { productId, quantity = 1 } = req.body;

//     if (!productId)
//       return res.status(400).json({ message: "Product ID is required" });

//     // 🧩 Fetch product
//     const product = await Product.findById(productId);
//     if (!product)
//       return res.status(404).json({ message: "Product not found" });

//     // ✅ Create Razorpay order
//     const options = {
//       amount: Math.round(product.price * quantity * 100), // ₹ → paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         productId: product._id.toString(),
//         productTitle: product.title,
//         productCategory: product.category,
//       },
//     };

//     const razorpayOrder = await razorpay.orders.create(options);

//     // ✅ Save order to DB
//     const newOrder = await Order.create({
//       user: userId,
//       product: productId,
//       quantity,
//       price: product.price,
//       totalAmount: product.price * quantity,
//       paymentMethod: "razorpay",
//       razorpayOrderId: razorpayOrder.id,
//       orderStatus: "pending",
//       productSnapshot: {
//         title: product.title,
//         category: product.category,
//         price: product.price,
//         thumbnail: product.thumbnail,
//       },
//     });

//     // 🔗 Add reference to user
//     await User.findByIdAndUpdate(userId, {
//       $push: { orders: newOrder._id },
//     });

//     res.status(201).json({
//       message: "Razorpay order created successfully ✅",
//       razorpayOrder,
//       orderId: newOrder._id,
//       productTitle: product.title,
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//       productThumbnail: product.thumbnail,
//     });
//   } catch (error) {
//     console.error("❌ Create Order Error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// // ✅ Verify Razorpay Payment
// export const verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderId,
//     } = req.body;

//     if (
//       !razorpay_order_id ||
//       !razorpay_payment_id ||
//       !razorpay_signature ||
//       !orderId
//     ) {
//       return res.status(400).json({ message: "Missing payment details" });
//     }

//     // 🔐 Verify Razorpay signature
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid Razorpay signature ❌" });
//     }

//     // ✅ Update order after payment success
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       {
//         isPaid: true,
//         orderStatus: "completed",
//         paymentInfo: {
//           id: razorpay_payment_id,
//           status: "paid",
//           paidAt: new Date(),
//         },
//       },
//       { new: true }
//     ).populate("product user");

//     if (!updatedOrder)
//       return res.status(404).json({ message: "Order not found" });

//     // 🧩 Step 4: Internally share Google Drive folder (no external call)
//     const product = updatedOrder.product;
//     const user = updatedOrder.user;

//     if (product?.folderId && user?.email) {
//       try {
//         await shareFolderWithUser(product.folderId, user.email);
//         console.log(
//           `✅ Folder shared: ${product.folderId} with ${user.email}`
//         );
//       } catch (shareError) {
//         console.error("⚠️ Error sharing folder:", shareError.message);
//       }
//     } else {
//       console.warn("⚠️ Missing folderId or user email — skipping share");
//     }

//     res.json({
//       success: true,
//       message: "Payment verified successfully ✅",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     console.error("❌ Verify Payment Error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

