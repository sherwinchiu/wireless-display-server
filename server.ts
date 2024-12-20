import express from "express";
import multer from "multer";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import { Storage } from "@google-cloud/storage";
const Busboy = require("busboy");
import { Jimp, JimpMime } from "jimp";

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
// const storage = new Storage({
//     keyFilename: path.join(__dirname, "./pixplay-442722-419ffc7a2404.json"),
//     projectId: "pixplay-442722",
// }); // create new client
const storage = new Storage();

const bucketName = "my-one-bucket"; // reference to bucket
const bucket = storage.bucket(bucketName); // can do whatever we want to it :)
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

async function convertBMP(buffer, res) {
    const image = await Jimp.read(buffer); // read buffer, convert to bmp, send
    // image.write("mybmp.bmp"); // testing metadata
    const bmpBuffer = await image.getBuffer("image/bmp");
    // res.status(200);
    res.status(200).send(bmpBuffer);
}
// endpoint to turn image into bmp first, and then send it.
app.get("/bmp", (req, res) => {
    // get file from google cloud storage
    // console.log("request!");
    const gcsFileName = "uploads/image.png"; // Fixed name for the uploaded image
    const file = bucket.file(gcsFileName);
    // check for file existance
    const exists = file.exists();
    if (!exists) {
        return res.status(404);
    }
    // create buffer
    const readStream = file.createReadStream();
    const chunks: Buffer[] = [];
    // create bmp by parsing all data into chunks
    readStream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
    });
    // after all data is read, send it over & combine all chunks
    readStream.on("end", () => {
        const buffer = Buffer.concat(chunks); // combine all chunks
        convertBMP(buffer, res);
    });
});
// Endpoint to handle the image upload. When client uploads image, do this
app.post("/imagehere", (req, res) => {
    try {
        const busboy = Busboy({ headers: req.headers }); // get busboyt to remove headers
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            const myFile = bucket.file("uploads/image.png");
            const myStream = myFile.createWriteStream();
            file.pipe(myStream).on("finish", () => {
                console.log("pipe to gcs");
                res.status(200).send("piped!");
            });
        });
        req.pipe(busboy);
    } catch (error) {
        console.log(error);
        console.log("uh oh");
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
