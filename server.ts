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

// Google Cloud Storage (GCS) Setup

const storage = new Storage();
const bucketName = "my-one-bucket";
const bucket = storage.bucket(bucketName);

// Initialize multer with the storage configuration
const upload = multer({ dest: "uploads/" });
// Init Docker

app.get("/", (req, res) => {
    req.get({
        headers: {
            "Content-Type": "application/json",
            host: null,
        },
    });
    res.send("Dockerizing Node Application");
});

// Serve static files (image) from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// When client starts, load image instantly for client after they request for new image. Loads from GCP
app.get("/image", (req, res) => {
    try {
        // get file from google cloud storage
        const gcsFileName = "uploaded-image"; // Fixed name for the uploaded image
        const file = bucket.file(gcsFileName);
        // check for file existance
        const exists = file.exists();
        if (!exists) {
            return res.status(404);
        }
        // stream file over to client
        const stream = file.createReadStream();
        stream.on("error", (err) => {
            console.error("Stream error:", err);
            res.status(500).send("Error streaming image.");
        });
        stream.pipe(res);
    } catch (error) {
        console.log("uh oh");
    }
});

// Endpoint to handle the image upload. When client uploads image, do this
app.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            // no file returned
            return res.status(400);
        }
        const tempFilePath = req.file.path;
        const gcsFileName = "image";
        // upload to gcs bucket! yay image stored
        bucket.upload(tempFilePath, {
            destination: gcsFileName,
            metadata: {
                contentType: req.file.mimetype,
            },
        });
        fs.unlinkSync(tempFilePath);
        res.json({ success: true, message: "File uploaded successfully!" });
    } catch (error) {
        console.log("uh oh");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
