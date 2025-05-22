import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, addDoc, query, where, getDocs } from 'firebase/firestore';

/**
 * Mark a user as an admin.
 * @param {string} uid - The UID of the user to mark as admin.
 */
export async function markAsAdmin(uid) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { role: 'admin' }, { merge: true });
}

/**
 * Request verification for a user.
 * @param {string} uid - The UID of the user making the request.
 * @param {string} collectionName - The name of the collection the user wants to manage.
 * @param {string} organizationName - The name of the user's organization.
 * @param {string} organizationEmail - The email of the user's organization.
 */
export async function requestVerification(uid, collectionName, organizationName, organizationEmail) {
    const requestsRef = collection(db, 'requests');
    await addDoc(requestsRef, {
        uid,
        collectionName,
        organizationName,
        organizationEmail,
        status: 'pending',
    });
}

/**
 * Approve a verification request.
 * @param {string} requestId - The ID of the request to approve.
 */
export async function approveRequest(requestId) {
    const requestRef = doc(db, 'requests', requestId);
    const requestSnapshot = await getDoc(requestRef);

    if (requestSnapshot.exists()) {
        const { uid, collectionName } = requestSnapshot.data();

        // Create a new collection document with the given collection name and attach the UID
        const collectionRef = doc(db, 'collections', collectionName);
        await setDoc(collectionRef, { owner: uid });

        // Update the request status to approved
        await setDoc(requestRef, { status: 'approved' }, { merge: true });
    } else {
        console.warn(`Request with ID ${requestId} does not exist.`);
    }
}

/**
 * Check if a user is an admin.
 * @param {string} uid - The UID of the user.
 * @returns {boolean} - True if the user is an admin, false otherwise.
 */
export async function isAdmin(uid) {
    try {
        const userRef = doc(db, 'users', uid); // Reference to the user's document
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            return userData.admin === true; // Check if the admin field is true
        } else {
            console.warn(`User document for UID ${uid} does not exist.`);
            return false;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false; // Ensure the function always returns a boolean
    }
}
