import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getEmbedding } from '../utils/embeddings'; // Updated import

/**
 * Fetch turtles from a specific Firestore collection.
 * @param {string} collectionName - The name of the Firestore collection.
 * @returns {Array} - Array of turtles.
 */
export async function fetchTurtlesFromCollection(collectionName) {
    const turtlesCollection = collection(db, collectionName);
    const snapshot = await getDocs(turtlesCollection);
    return snapshot.docs.flatMap(doc => {
        const data = doc.data();
        return (data.images || []).map(imageData => ({
            id: doc.id, // Use the document ID
            ...imageData, // Spread image and embedding data
        }));
    });
}

/**
 * Generate embeddings for all images in a Firestore collection.
 * @param {string} collectionName - The name of the Firestore collection.
 */
export async function generateEmbeddingsForCollection(collectionName) {
    const turtlesCollection = collection(db, collectionName);
    const snapshot = await getDocs(turtlesCollection);

    for (const turtleDoc of snapshot.docs) {
        const turtle = turtleDoc.data();

        // Ensure the document has an 'images' array
        if (Array.isArray(turtle.images)) {
            const updatedImages = await Promise.all(
                turtle.images.map(async (imageData) => {
                    if (!imageData.embedding) {
                        try {
                            // Create an HTMLImageElement from the image string
                            const img = new Image();
                            img.src = imageData.image;

                            // Wait for the image to load
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                            });

                            const embedding = await getEmbedding(img); // Generate embedding for the image
                            return { ...imageData, embedding: JSON.stringify(embedding) };
                        } catch (error) {
                            console.error(`Error generating embedding for image in document ${turtleDoc.id}:`, error);
                            console.log('Invalid image data:', imageData); // Log invalid image data
                            return { ...imageData, embedding: null }; // Explicitly set embedding to null if generation fails
                        }
                    }
                    return imageData; // Return the original image data if embedding already exists
                })
            );

            const turtleRef = doc(db, collectionName, turtleDoc.id);

            // Update the document with the updated images array
            await updateDoc(turtleRef, { images: updatedImages });
        } else {
            console.warn(`Document with ID ${turtleDoc.id} does not have a valid 'images' array.`);
        }
    }
}
