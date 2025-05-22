import { generateEmbeddings } from '../utils/generateEmbeddings.js';
// ...existing code...

// Add a button to trigger embedding generation
const generateEmbeddingsButton = document.getElementById('generateEmbeddingsButton');

generateEmbeddingsButton.addEventListener('click', async () => {
    try {
        console.log("Generating embeddings for all turtles...");
        await generateEmbeddings(); // Call the function
        alert("Embeddings generated successfully. Check the console for the updated turtles.json.");
    } catch (error) {
        console.error("Error generating embeddings:", error);
        alert("Failed to generate embeddings. Check the console for details.");
    }
});

// ...existing code...