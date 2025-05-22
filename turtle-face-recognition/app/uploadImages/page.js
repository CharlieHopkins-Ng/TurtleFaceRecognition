'use client';

import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { onSnapshot, deleteField, doc, updateDoc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import * as Sentry from '@sentry/react';
import imageCompression from 'browser-image-compression';
import { getEmbedding } from '../../utils/embeddings'; // Import the embedding generation function
import { getAuth } from 'firebase/auth';
import { isAdmin, requestVerification } from '../../src/userManagement'; // Import the requestVerification function
import { useRouter } from 'next/navigation';
import '../../styles/styles.css'; // Import the styles.css file
import NavBar from '../../components/NavBar'; // Import the NavBar component
import Image from 'next/image'; // Add this import

export default function UploadImages() {
    const [image, setImage] = useState(null);
    const [id, setId] = useState('');
    const [collectionName, setCollectionName] = useState('');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [user, setUser] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [isVerified, setIsVerified] = useState(false); // Track if the user is verified
    const [organizationName, setOrganizationName] = useState(''); // Track organization name
    const [organizationEmail, setOrganizationEmail] = useState(''); // Track organization email
    const router = useRouter();

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
            const compressedImage = await imageCompression(image, {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });

            const reader = new FileReader();
            reader.onload = async () => {
                const base64Image = reader.result;

                // Generate embedding for the image
                const img = new Image();
                img.src = base64Image;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                });
                const embedding = await getEmbedding(img);

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

                alert('Image and embedding uploaded successfully!');
                setImage(null);
                setId('');
                setCollectionName('');
            };
            reader.readAsDataURL(compressedImage);
        } catch (error) {
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
        <div className={darkMode ? 'dark-mode' : ''}>
            <NavBar />
            <div>
                <h1>Upload Images</h1>
                {!user ? (
                    <p>You must be logged in to upload images.</p>
                ) : !isVerified && !isUserAdmin ? (
                    <div>
                        <p>You are not verified to upload images. Apply for verification below:</p>
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
                        <div>
                            <label>
                                Organization Name:
                                <input
                                    type="text"
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
                                />
                            </label>
                        </div>
                        <div>
                            <label>
                                Organization Email:
                                <input
                                    type="email"
                                    value={organizationEmail}
                                    onChange={(e) => setOrganizationEmail(e.target.value)}
                                />
                            </label>
                        </div>
                        <button onClick={handleVerificationRequest}>
                            Apply for Verification
                        </button>
                    </div>
                ) : (
                    <>
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
                        <div>
                            <label>
                                ID:
                                <input
                                    type="text"
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                />
                            </label>
                        </div>
                        <div>
                            <label>
                                Image:
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                        <button onClick={handleUpload} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                        <div className="uploaded-images">
                            <h2>Uploaded Images</h2>
                            {images.map(image => (
                                <div key={image.id} className="image-item">
                                    <Image src={image.image} alt={image.id} width={100} height={100} />
                                    <p>{image.id}</p>
                                    <button
                                        className="delete"
                                        onClick={() => handleDelete(image.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {isUserAdmin && <p>You are an admin.</p>}
            </div>
        </div>
    );
}
