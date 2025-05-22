'use client';

import { useEffect, useState } from 'react';
import ImageUploader from './components/ImageUploader';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Correct import path for db
import { findBestMatches } from '../utils/similarity';
import { getAuth } from 'firebase/auth';
import Image from 'next/image';
import { isAdmin } from '../src/userManagement';
import NavBar from '../components/NavBar';
import '../styles/styles.css';

export default function Home() {
    const [collectionName, setCollectionName] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const adminStatus = await isAdmin(currentUser.uid);
                setIsUserAdmin(adminStatus);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch all images and embeddings from all turtle IDs in the collection
    const fetchAllTurtleImages = async (collectionName) => {
        const collectionDocRef = doc(db, 'collections', collectionName);
        const collectionDocSnap = await getDoc(collectionDocRef);
        if (!collectionDocSnap.exists()) return [];
        const turtleIds = collectionDocSnap.data().turtleIds || [];

        let allImages = [];
        for (const turtleId of turtleIds) {
            const imageDocRef = doc(db, 'collections', collectionName, turtleId, 'Image');
            const imageDocSnap = await getDoc(imageDocRef);
            if (imageDocSnap.exists()) {
                const data = imageDocSnap.data();
                Object.values(data).forEach((value) => {
                    allImages.push({
                        id: turtleId,
                        image: value.image,
                        embedding: value.embedding,
                    });
                });
            }
        }
        return allImages;
    };

    // Handle image upload and similarity search
    const handleImageUpload = async (embedding) => {
        if (!collectionName) {
            alert('Please enter a collection name.');
            return;
        }
        setLoading(true);
        try {
            // Fetch all images for all turtles in the collection
            const allImages = await fetchAllTurtleImages(collectionName);
            setDatabase(allImages);

            // Find top 5 matches
            const matches = findBestMatches(embedding, allImages, 5);
            setResults(matches);
        } catch (error) {
            console.error('Error finding matches:', error);
            alert('Failed to find matches. Check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavBar />
            <main>
                <div>
                    <label>
                        Collection Name:
                        <input
                            type="text"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                        />
                    </label>
                </div>
                <div className="uploader">
                    <ImageUploader onImageUpload={handleImageUpload} />
                    {loading && <p>Loading and matching...</p>}
                </div>
                <div className="results">
                    <h2>Top 5 Matches</h2>
                    {results.map((match, index) => (
                        <div key={`${match.id}-${index}`} className="result-item">
                            <Image src={match.image} alt={match.id} width={100} height={100} />
                            <p>{match.id}: {Math.round(match.score * 100)}%</p>
                        </div>
                    ))}
                    {results.length === 0 && <p>No matches found.</p>}
                </div>
            </main>
        </>
    );
}
