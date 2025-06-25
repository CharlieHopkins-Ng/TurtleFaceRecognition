'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { onSnapshot, deleteField, doc, updateDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import * as Sentry from '@sentry/react';
import imageCompression from 'browser-image-compression';
import { getEmbedding } from '../../utils/embeddings'; // Import the embedding generation function
import { getAuth } from 'firebase/auth';
import { isAdmin, requestVerification } from '../../src/userManagement'; // Import the requestVerification function
import '../../styles/styles.css'; // Import the styles.css file
import NavBar from '../../components/NavBar'; // Import the NavBar component
import Image from 'next/image'; // Keep this import for rendering images

export default function UploadImages() {
    const [image, setImage] = useState(null);
    const [id, setId] = useState('');
    const [collectionName, setCollectionName] = useState('');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [user, setUser] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [isVerified, setIsVerified] = useState(false); // Track if the user is verified
    const [organizationName, setOrganizationName] = useState(''); // Track organization name
    const [organizationEmail, setOrganizationEmail] = useState(''); // Track organization email
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const adminStatus = await isAdmin(currentUser.uid); // Use the updated isAdmin function
                    setIsUserAdmin(adminStatus);
                    console.log(`User Admin Status: ${adminStatus}`); // Log admin status

                    // Check if the user is verified
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDocSnapshot = await getDoc(userDocRef);
                    const verifiedStatus = userDocSnapshot.exists() && userDocSnapshot.data().verified === true;
                    setIsVerified(verifiedStatus);

                    // Log the user's UID and verification status
                    console.log(`User UID: ${currentUser.uid}`);
                    console.log(`User Verified Status: ${verifiedStatus}`); // Log verification status
                } catch (error) {
                    console.error('Error during user authentication or admin check:', error);
                    setIsUserAdmin(false); // Default to false if an error occurs
                    setIsVerified(false); // Default to false if an error occurs
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleUpload = async () => {
        if (!user) {
            alert('You must be logged in to upload images.');
            return;
        }

        if (!image || !id || !collectionName.trim()) {
            alert('Please provide an image, ID, and collection name.');
            return;
        }

        try {
            setLoading(true);
            setUploadProgress(10); // Start progress

            // Check if the user owns the collection
            const collectionRef = doc(db, 'collections', collectionName);
            const collectionSnapshot = await getDoc(collectionRef);

            if (!collectionSnapshot.exists()) {
                alert('The specified collection does not exist.');
                return;
            }

            const ownerUid = collectionSnapshot.data().owner;
            if (ownerUid !== user.uid) {
                alert('You do not have permission to edit this collection.');
                return;
            }

            // --- Add the turtle ID to the collection's turtleIds array if not present ---
            if (id) {
                await updateDoc(collectionRef, {
                    turtleIds: arrayUnion(id)
                });
            }

            // Compress the image before uploading
            setUploadProgress(20);
            const compressedImage = await imageCompression(image, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                onProgress: (progress) => setUploadProgress(20 + Math.round(progress * 0.5)), // 20-70%
            });
            setUploadProgress(70);

            const reader = new FileReader();
            reader.onload = async () => {
                const base64Image = reader.result;

                // Use the browser's global Image constructor, not next/image
                setUploadProgress(80);
                const img = new window.Image();
                img.src = base64Image;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                setUploadProgress(85);

                const embedding = await getEmbedding(img);
                setUploadProgress(90);

                // Get the Image document reference
                const imageDocRef = doc(db, 'collections', collectionName, id, 'Image');
                const imageDocSnap = await getDoc(imageDocRef);

                let nextIndex = 1;
                let newData = {};
                if (imageDocSnap.exists()) {
                    const data = imageDocSnap.data();
                    // Find the next available numeric key
                    const keys = Object.keys(data).map(k => parseInt(k)).filter(n => !isNaN(n));
                    nextIndex = keys.length > 0 ? Math.max(...keys) + 1 : 1;
                    newData = { ...data };
                }
                newData[nextIndex.toString()] = {
                    image: base64Image,
                    embedding: JSON.stringify(embedding),
                    uploadedAt: new Date().toISOString(),
                };

                await setDoc(imageDocRef, newData);

                setUploadProgress(100);
                alert('Image and embedding uploaded successfully!');
                setImage(null);
                // Do not reset id or collectionName
                // setId('');
                // setCollectionName('');
                setTimeout(() => setUploadProgress(0), 500); // Reset after short delay
            };
            reader.readAsDataURL(compressedImage);
        } catch (error) {
            setUploadProgress(0);
            console.error('Error uploading image:', error);
            Sentry.captureException(error);
            alert('Failed to upload image. Check the console for details.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch images for display
    useEffect(() => {
        if (!collectionName.trim() || !id.trim()) {
            setImages([]);
            return;
        }
        // Listen to the Image document
        const imageDocRef = doc(db, 'collections', collectionName, id, 'Image');
        const unsubscribe = onSnapshot(
            imageDocRef,
            (docSnap) => {
                if (!docSnap.exists()) {
                    setImages([]);
                    return;
                }
                const data = docSnap.data();
                // Convert fields to array of {id, image, ...}
                const fetchedImages = Object.entries(data).map(([key, value]) => ({
                    id: key,
                    ...value,
                }));
                setImages(fetchedImages);
            },
            (error) => {
                console.error(`Error fetching images:`, error);
                setImages([]);
            }
        );
        return () => unsubscribe();
    }, [collectionName, id]);

    const handleDelete = async (imageId) => {
    if (!collectionName || !id) {
        alert('Please enter a collection name and ID.');
        return;
    }

    try {
        const imageDocRef = doc(db, 'collections', collectionName, id, 'Image');
        await updateDoc(imageDocRef, {
            [imageId]: deleteField()
        });
        alert('Image deleted successfully!');
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image. Check the console for details.');
    }
};

    const handleVerificationRequest = async () => {
        if (!collectionName.trim() || !organizationName.trim() || !organizationEmail.trim()) {
            alert('Please provide a collection name, organization name, and organization email to apply for verification.');
            return;
        }

        try {
            await requestVerification(user.uid, collectionName, organizationName, organizationEmail);
            alert('Verification request submitted successfully.');
        } catch (error) {
            console.error('Error submitting verification request:', error);
            alert('Failed to submit verification request. Check the console for details.');
        }
    };

    return (
        <div>
            <NavBar />
            <div style={{
                maxWidth: 700,
                margin: '40px auto',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                padding: '32px',
            }}>
                <h1 style={{ marginBottom: 24 }}>Upload Images</h1>
                {!user ? (
                    <p>You must be logged in to upload images.</p>
                ) : !isVerified && !isUserAdmin ? (
                    <div>
                        <p style={{ marginBottom: 16 }}>You are not verified to upload images. Apply for verification below:</p>
                        <div style={{ marginBottom: 12 }}>
                            <label>
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
                        <div style={{ marginBottom: 12 }}>
                            <label>
                                Organization Name:
                                <input
                                    type="text"
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
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
                        <div style={{ marginBottom: 12 }}>
                            <label>
                                Organization Email:
                                <input
                                    type="email"
                                    value={organizationEmail}
                                    onChange={(e) => setOrganizationEmail(e.target.value)}
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
                        <button
                            onClick={handleVerificationRequest}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                marginTop: 8,
                            }}
                        >
                            Apply for Verification
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <label>
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
                        <div style={{ marginBottom: 12 }}>
                            <label>
                                ID:
                                <input
                                    type="text"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
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
                        <div style={{ marginBottom: 12 }}>
                            <label>
                                Image:
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
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
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 500,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                marginBottom: 24,
                            }}
                        >
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                        {loading && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{
                                    width: '100%',
                                    height: 12,
                                    background: '#eee',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    marginTop: 8
                                }}>
                                    <div style={{
                                        width: `${uploadProgress}%`,
                                        height: '100%',
                                        background: '#1976d2',
                                        transition: 'width 0.2s'
                                    }} />
                                </div>
                                <div style={{ fontSize: 12, marginTop: 4, color: '#1976d2' }}>
                                    {uploadProgress}% complete
                                </div>
                            </div>
                        )}
                        <div className="uploaded-images" style={{ marginTop: 32 }}>
                            <h2 style={{ marginBottom: 16 }}>Uploaded Images</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                                {images.map(image => (
                                    <div key={image.id} className="image-item" style={{
                                        background: '#f9f9f9',
                                        borderRadius: 8,
                                        padding: 12,
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: 140,
                                    }}>
                                        <Image
                                            src={image.image}
                                            alt={image.id}
                                            width={100}
                                            height={100}
                                            style={{ borderRadius: 6, height: "auto" }}
                                        />
                                        <p style={{ margin: '10px 0 6px 0', fontWeight: 500 }}>{image.id}</p>
                                        <button
                                            className="delete"
                                            onClick={() => handleDelete(image.id)}
                                            style={{
                                                padding: '6px 14px',
                                                backgroundColor: '#d32f2f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                {isUserAdmin && <p style={{ marginTop: 24, color: '#1976d2', fontWeight: 500 }}>You are an admin.</p>}
            </div>
        </div>
    );
}
