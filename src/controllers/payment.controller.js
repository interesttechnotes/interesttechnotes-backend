import Razorpay from "razorpay";
import crypto from "crypto";
import { Product } from "../models/Product.model.js";
import { Order } from "../models/Order.model.js";
import { User } from "../models/User.model.js";
import { shareFolderWithUser } from "./shareFolder.controller.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId)
      return res.status(400).json({ message: "Product ID is required" });

    // 🧩 Fetch product
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    // ✅ Create Razorpay order
    const options = {
      amount: Math.round(product.price * quantity * 100), // ₹ → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        productId: product._id.toString(),
        productTitle: product.title,
        productCategory: product.category,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // ✅ Save order to DB
    const newOrder = await Order.create({
      user: userId,
      product: productId,
      quantity,
      price: product.price,
      totalAmount: product.price * quantity,
      paymentMethod: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      orderStatus: "pending",
      productSnapshot: {
        title: product.title,
        category: product.category,
        price: product.price,
        thumbnail: product.thumbnail,
      },
    });

    // 🔗 Add reference to user
    await User.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    res.status(201).json({
      message: "Razorpay order created successfully ✅",
      razorpayOrder,
      orderId: newOrder._id,
      productTitle: product.title,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      productThumbnail: product.thumbnail,
    });
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ Verify Razorpay Payment
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

    // 🔐 Verify Razorpay signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Razorpay signature ❌" });
    }

    // ✅ Update order after payment success
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
    ).populate("product user");

    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });

    // 🧩 Step 4: Internally share Google Drive folder (no external call)
    const product = updatedOrder.product;
    const user = updatedOrder.user;

    if (product?.folderId && user?.email) {
      try {
        await shareFolderWithUser(product.folderId, user.email);
        console.log(
          `✅ Folder shared: ${product.folderId} with ${user.email}`
        );
      } catch (shareError) {
        console.error("⚠️ Error sharing folder:", shareError.message);
      }
    } else {
      console.warn("⚠️ Missing folderId or user email — skipping share");
    }

    res.json({
      success: true,
      message: "Payment verified successfully ✅",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Verify Payment Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

