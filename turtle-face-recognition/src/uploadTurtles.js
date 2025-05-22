// filepath: d:\Projects\TurtleFaceRecognition\scripts\uploadTurtles.js
import { db } from "../firebaseConfig.js";
import { collection, addDoc } from "firebase/firestore";
import { readFile } from "fs/promises";
import path from "path";

const uploadTurtles = async () => {
    try {
        // Resolve the path to turtles.json
        const filePath = path.resolve("public/data/turtles.json");
        const fileContent = await readFile(filePath, "utf-8");
        const turtles = JSON.parse(fileContent); // Parse the JSON content

        const turtlesCollection = collection(db, "turtles");
        for (const turtle of turtles) {
            // Stringify the embeddings field to avoid nested arrays
            const turtleData = {
                ...turtle,
                embeddings: turtle.embeddings.map(embedding => JSON.stringify(embedding)),
            };

            await addDoc(turtlesCollection, turtleData);
            console.log(`Uploaded turtle: ${turtle.id}`);
        }
        console.log("All turtles uploaded successfully.");
    } catch (error) {
        console.error("Error uploading turtles:", error);
    }
};

uploadTurtles();