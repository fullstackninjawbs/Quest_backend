import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { addEmployee, getEmployees, addEmployeeCSV } from "../controllers/employee.controller.js";
import employerAuth from "../middleware/employer.middleware.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = "uploads/temp";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration (Step 3 & 7 of Milestones)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv") {
        cb(null, true);
    } else {
        cb(new Error("Only CSV files are allowed"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// All employee routes require Employer Authentication
router.use(employerAuth);

// Single Employee Routes
router.post("/add", addEmployee);
router.get("/list", getEmployees);

// Bulk CSV Route (Step 3)
router.post("/add-csv", upload.single("file"), addEmployeeCSV);

export default router;
