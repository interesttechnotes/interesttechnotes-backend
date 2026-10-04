import Razorpay from "razorpay";
import crypto from "crypto";
import { Order } from "../models/Order.model.js";
import { shareFolderWithUser } from "./shareFolder.controller.js";
import { getFileWithCredentials } from "../utils/shopDrive.js";
import { getShopCredentials } from "../services/shop.service.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const parseDescription = (desc) => {
  try {
    return desc ? JSON.parse(desc) : {};
  } catch {
    return {};
  }
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    const shopId = Number(req.body.shopId);

    if (!productId || !Number.isInteger(shopId) || shopId < 1) {
      return res
        .status(400)
        .json({ message: "productId and shopId are required" });
    }

    // 1️⃣ Load the shop and use ITS Drive credentials
    const shop = await getShopCredentials(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // 2️⃣ Fetch the file from that shop's Drive
    const file = await getFileWithCredentials(
      shop.google_drive_json,
      productId,
    );
    if (!file) {
      return res.status(404).json({ message: "File not found in this shop" });
    }

    // 3️⃣ Price from the file description JSON, fallback ₹10
    const meta = parseDescription(file.description);
    const amount =
      typeof meta.price === "number" && meta.price > 0 ? meta.price : 10;

    // 4️⃣ Razorpay order (shopId kept in notes for reference)
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: { fileId: file.id, fileName: file.name, shopId: String(shop.id) },
    });

    // 5️⃣ Save order in MongoDB (needs `shopId` in the Order schema)
    const newOrder = await Order.create({
      user: userId,
      shopId: shop.id,
      file: { id: file.id, name: file.name, url: file.url },
      amount,
      paymentMethod: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      orderStatus: "pending",
      isPaid: false,
    });

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

    // 1️⃣ Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Razorpay signature ❌" });
    }

    // 2️⃣ Mark paid. The filter ties the payment to THIS order and THIS user,
    //    and isPaid:false stops it being processed (and shared) twice.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        razorpayOrderId: razorpay_order_id,
        user: req.user.id,
        isPaid: false,
      },
      {
        isPaid: true,
        orderStatus: "completed",
        paymentInfo: {
          id: razorpay_payment_id,
          status: "paid",
          paidAt: new Date(),
        },
      },
      { new: true },
    ).populate("user", "email");

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ message: "Order not found or already processed" });
    }

    // 3️⃣ Auto-share the file using the owning shop's credentials
    const fileId = updatedOrder.file?.id;
    const userEmail = updatedOrder.user?.email;
    let shared = false;

    if (fileId && userEmail && updatedOrder.shopId) {
      try {
        const shop = await getShopCredentials(updatedOrder.shopId);
        if (!shop) throw new Error(`Shop ${updatedOrder.shopId} not found`);

        await shareFolderWithUser(
          shop.google_drive_json,
          fileId,
          userEmail,
          updatedOrder.file?.name,
        );
        shared = true;
        console.log(`✅ File ${fileId} shared with ${userEmail}`);
      } catch (shareError) {
        console.warn("⚠️ Google Drive share failed:", shareError.message);
      }
    } else {
      console.warn(
        `⚠️ Skipping share for order ${orderId}: missing fileId, email or shopId`,
      );
    }

    // 4️⃣ Response
    return res.json({
      success: true,
      shared,
      message: shared
        ? "Payment verified successfully ✅ Check your email for access."
        : "Payment verified ✅ but we couldn't share the file automatically. Please contact support.",
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
