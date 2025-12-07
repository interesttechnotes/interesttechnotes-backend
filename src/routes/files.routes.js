import express from "express";
import { getDriveFiles } from "../controllers/files.controller.js";

const router = express.Router();

router.get("/", getDriveFiles);

export default router;
