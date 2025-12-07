import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 File purchased (from Google Drive)
    file: {
      id: { type: String, required: true },      // Google Drive file id
      name: { type: String, required: true },    // filename
      url: { type: String, required: true },     // view/download URL
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe", "paypal"],
      default: "razorpay",
      required: true,
    },

    razorpayOrderId: { type: String },

    paymentInfo: {
      id: String,
      status: String, // paid / failed
      paidAt: Date,
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "cancelled"],
      default: "pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);

// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },

//     quantity: {
//       type: Number,
//       required: true,
//       min: 1,
//       default: 1,
//     },

//     price: {
//       type: Number,
//       required: true, // snapshot of product price at order time
//     },

//     totalAmount: {
//       type: Number,
//       required: true,
//     },

//     paymentMethod: {
//       type: String,
//       enum: ["razorpay", "stripe", "paypal"],
//       required: true,
//       default: "razorpay",
//     },

//     paymentInfo: {
//       id: { type: String }, // Razorpay payment ID
//       status: { type: String }, // 'paid', 'failed', 'pending'
//       paidAt: { type: Date },
//     },

//     orderStatus: {
//       type: String,
//       enum: ["pending", "processing", "completed", "cancelled", "refunded"],
//       default: "pending",
//     },

//     isPaid: { type: Boolean, default: false },

//     razorpayOrderId: { type: String },

//     // 🧠 Snapshot of product details (so you can still show info later)
//     productSnapshot: {
//       title: String,
//       category: String,
//       price: Number,
//       thumbnail: String,
//     },
//   },
//   { timestamps: true }
// );

// export const Order = mongoose.model("Order", orderSchema);
