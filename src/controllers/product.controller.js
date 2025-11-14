import { Product } from "../models/Product.model.js";

// Get All Products
export const getProducts = async (req, res) => {
  try {
    console.log("products ");
    
    const products = await Product.find();
    return res.json({ message: "Products fetched ✅", products });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
