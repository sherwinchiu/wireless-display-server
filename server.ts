import express from "express";
import multer from "multer";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";

// Create the Express app
const app = express();
const port = 3000;
// Enable CORS
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads"); // Directory where the image will be saved
    },
    filename: (req, file, cb) => {
        cb(null, "image.png"); // Save the file as image.png (only one image at a time)
    },
});

// Initialize multer with the storage configuration
const upload = multer({ storage });

// Serve static files (image) from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint to handle the image upload
app.post("/upload", upload.single("file"), (req, res) => {
    console.log("Image upload");
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./uploads/image.png");

    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
        fs.rename(tempPath, targetPath, (err) => {
            if (err) return;

            res.status(200).contentType("text/plain").end("File uploaded!");
        });
    } else {
        fs.unlink(tempPath, (err) => {
            if (err) return;

            res.status(403).contentType("text/plain").end("Only .png files are allowed!");
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
