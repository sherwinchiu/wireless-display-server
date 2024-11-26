import express from "express";
import multer from "multer";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import { Storage } from "@google-cloud/storage";

// Create the Express app
const app = express();
const port = 8080;
// Enable CORS
app.use(
    cors({
        origin: "*", // Or specify your frontend URL if you want to limit origins
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Google Cloud Storage (GCS) Setup

const storage = new Storage(); // create new client
const bucketName = "pixplay-442722.appspot.com"; // reference to bucket
const bucket = storage.bucket(bucketName);
// Local Storage Setup

const upload = multer({ dest: "uploads/" });

app.get("/image", (req, res) => {
    try {
        // get file from google cloud storage
        const gcsFileName = "uploads/image.png"; // Fixed name for the uploaded image
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

async function uploadFile(filePath) {
    const options = {
        destination: "uploads/image.png",
    };
    await bucket.upload(filePath, options);
    console.log("Should be uiploaded ");
}

// Endpoint to handle the image upload. When client uploads image, do this
app.post("/upload", upload.single("file"), (req, res) => {
    console.log("Image upload");
    console.log(req.file.path);
    uploadFile(req.file.path);

    fs.unlinkSync(req.file.path);

    res.status(200).send("file shouldve been processed probably hopefully");
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
