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
const port = 3000;
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
const bucketName = "my-one-bucket"; // reference to bucket
const bucket = storage.bucket(bucketName);
// Local Storage Setup
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads"); // Directory where the image will be saved
    },
    filename: (req, file, cb) => {
        cb(null, "image.png"); // Save the file as image.png (only one image at a time)
    },
});
const upload = multer({ multerStorage });

// Serve static files (image) from the 'uploads' folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// When client starts, load image instantly for client after they request for new image. Loads from GCP
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
    const destination = path.basename(filePath);
    const options = {
        destination: destination,
    };
    await bucket.upload(filePath, options);
    console.log("Should be uiploaded ");
}

// Endpoint to handle the image upload. When client uploads image, do this
app.post("/upload", upload.single("file"), (req, res) => {
    console.log("Image upload");
    const tempPath = req.file.path;
    // const targetPath = path.join(__dirname, "./uploads/image.png");

    // if (path.extname(req.file.originalname).toLowerCase() === ".png") {
    //     fs.rename(tempPath, targetPath, (err) => {
    //         if (err) return;

    //         res.status(200).contentType("text/plain").end();
    //     });
    // } else {
    //     fs.unlink(tempPath, (err) => {
    //         if (err) return;

    //         res.status(403).contentType("text/plain").end("Only .png!");
    //     });
    // }

    // console.log("uploading...");
    // // upload to gcs bucket! yay image stored
    uploadFile(tempPath).catch(console.error);
    fs.unlinkSync(tempPath); // Delete the temporary file

    console.log("succesfully uploaded!");
    res.json({ success: true, message: "File uploaded successfully!" });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
