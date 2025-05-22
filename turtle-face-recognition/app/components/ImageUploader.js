'use client';

import { useState } from 'react';
import { getEmbedding } from '../../utils/embeddings';

export default function ImageUploader({ onImageUpload }) {
    const [loading, setLoading] = useState(false);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = async () => {
            setLoading(true);
            try {
                const embedding = await getEmbedding(img); // Generate embedding for the uploaded image
                onImageUpload(embedding); // Pass the embedding to the parent component
            } catch (error) {
                console.error("Error generating embedding:", error);
            } finally {
                setLoading(false);
            }
        };
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {loading && <p>Loading...</p>}
        </div>
    );
}
