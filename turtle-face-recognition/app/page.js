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
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                await isAdmin(currentUser.uid);
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
        setProgress(10); // Start progress
        try {
            // Fetch all images for all turtles in the collection
            setProgress(30);
            const allImages = await fetchAllTurtleImages(collectionName);

            setProgress(60);
            // Find top 5 matches
            const matches = findBestMatches(embedding, allImages, 5);
            setProgress(100);
            setResults(matches);
            setTimeout(() => setProgress(0), 500); // Reset after short delay
        } catch (error) {
            setProgress(0);
            console.error('Error finding matches:', error);
            alert('Failed to find matches. Check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <NavBar />
            <main style={{
                maxWidth: 700,
                margin: '40px auto',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                padding: '32px',
            }}>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontWeight: 500, marginRight: 12 }}>
                        Collection Name:
                        <input
                            type="text"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            style={{
                                marginLeft: 12,
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #bbb',
                                fontSize: '1rem',
                                marginTop: 4,
                            }}
                        />
                    </label>
                </div>
                <div className="uploader" style={{ marginBottom: '32px' }}>
                    <ImageUploader onImageUpload={handleImageUpload} />
                    {loading && (
                        <div style={{ marginTop: 12, marginBottom: 12 }}>
                            <div style={{
                                width: '100%',
                                height: 12,
                                background: '#eee',
                                borderRadius: 6,
                                overflow: 'hidden',
                                marginTop: 8
                            }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background: '#1976d2',
                                    transition: 'width 0.2s'
                                }} />
                            </div>
                            <div style={{ fontSize: 12, marginTop: 4, color: '#1976d2' }}>
                                {progress}% complete
                            </div>
                        </div>
                    )}
                </div>
                <div className="results">
                    <h2 style={{ marginBottom: 16 }}>Top 5 Matches</h2>
                    {results.map((match, index) => (
                        <div key={`${match.id}-${index}`} className="result-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 18,
                            marginBottom: 18,
                            padding: '12px 0',
                            borderBottom: '1px solid #eee'
                        }}>
                            <Image
                                src={match.image}
                                alt={match.id}
                                width={100}
                                height={100}
                                style={{ borderRadius: 8, height: "auto" }}
                            />
                            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{match.id}: {Math.round(match.score * 100)}%</p>
                        </div>
                    ))}
                    {results.length === 0 && <p>No matches found.</p>}
                </div>
            </main>
        </>
    );
}
