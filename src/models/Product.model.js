// models/Product.model.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    folderId: {
      type: String,
      required: true, // Google Drive folder ID
    },
    thumbnail: {
      type: String, // optional: public image URL
    },
    imagesCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "Uncategorized",
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
