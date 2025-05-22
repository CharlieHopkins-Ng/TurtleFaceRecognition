import * as tf from '@tensorflow/tfjs'; // Use tfjs for browser compatibility
import { loadModel, getEmbedding } from '../model.js';

async function generateEmbeddings() {
    // Fetch turtles.json from the public directory
    const response = await fetch('/data/turtles.json'); // Updated URL
    if (!response.ok) {
        throw new Error(`Failed to load turtles.json: ${response.statusText}`);
    }
    const turtles = await response.json();

    await loadModel(); // Load the MobileNet model

    for (const turtle of turtles) {
        console.log(`Processing turtle ID: ${turtle.id}`);
        const embeddings = [];

        for (const imagePath of turtle.images) {
            const img = new Image();
            img.src = imagePath;

            // Wait for the image to load
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // Generate embedding for the image
            const embedding = await getEmbedding(img);
            embeddings.push(embedding);
        }

        // Update the embeddings array for the turtle
        turtle.embeddings = embeddings;
    }

    // Log the updated turtles.json for manual saving
    console.log("Updated turtles.json:", JSON.stringify(turtles, null, 4));
}

export { generateEmbeddings }; // Export the function
