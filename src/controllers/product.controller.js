import { Product } from "../models/Product.model.js";
import { getFilesInFolder } from "../utils/googleDrive.js";

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await getFilesInFolder(product.folderId);

        return {
          ...product.toObject(),
          images,
          amount: 10, // ⭐ Add your extra custom field here
        };
      })
    );

    return res.json({
      message: "Products fetched with drive images and extra data ✅",
      products: productsWithImages,
    });

  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// import { Product } from "../models/Product.model.js";
// import { getFilesInFolder } from "../utils/googleDrive.js";

// // Get All Products
// // export const getProducts = async (req, res) => {
// //   try {
// //     console.log("products ");
    
// //     const products = await Product.find();
// //     return res.json({ message: "Products fetched ✅", products });
// //   } catch (error) {
// //     console.error("Get Products Error:", error);
// //     res.status(500).json({ message: "Server Error" });
// //   }
// // };


// export const getProducts = async (req, res) => {
//   try {
//     const products = await Product.find();

//     const productsWithImages = await Promise.all(
//       products.map(async (product) => {
//         const images = await getFilesInFolder(product.folderId);
//         return {
//           ...product.toObject(),
//           images,  // attach Google Drive images
//         };
//       })
//     );

//     return res.json({
//       message: "Products fetched with images ✅",
//       products: productsWithImages,
//     });
//   } catch (error) {
//     console.error("Get Products Error:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };