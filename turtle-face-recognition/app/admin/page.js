'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { approveRequest } from '../../src/userManagement';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import NavBar from '../../components/NavBar'; // Import the NavBar component

export default function AdminPage() {
    const [requests, setRequests] = useState([]);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchRequests = async () => {
            const requestsRef = collection(db, 'requests');
            const snapshot = await getDocs(requestsRef);
            const fetchedRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(fetchedRequests);
        };

        fetchRequests();
    }, []);

    const handleApprove = async (requestId) => {
        await approveRequest(requestId);
        alert('Request approved.');
        setRequests(requests.filter(request => request.id !== requestId));
    };

    const handleDeny = async (requestId) => {
        try {
            const requestRef = doc(db, 'requests', requestId);
            await deleteDoc(requestRef);
            alert('Request denied.');
            setRequests(requests.filter(request => request.id !== requestId));
        } catch (error) {
            console.error('Error denying request:', error);
            alert('Failed to deny request. Check the console for details.');
        }
    };

    const handleSignOut = async () => {
        const auth = getAuth();
        await signOut(auth);
        alert('You have been signed out.');
        router.push('/');
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <NavBar /> {/* Use the NavBar component */}
            <div style={{ padding: '20px' }}>
                <h1>Admin Dashboard</h1>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {requests.map(request => (
                        <li key={request.id} style={{
                            marginBottom: '15px',
                            padding: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            backgroundColor: '#f9f9f9',
                        }}>
                            <p><strong>User:</strong> {request.uid}</p>
                            <p><strong>Collection:</strong> {request.collectionName}</p>
                            <p><strong>Organization Name:</strong> {request.organizationName}</p>
                            <p><strong>Organization Email:</strong> {request.organizationEmail}</p>
                            <p><strong>Status:</strong> {request.status}</p>
                            {request.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApprove(request.id)}
                                        style={{
                                            padding: '10px 15px',
                                            backgroundColor: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleDeny(request.id)}
                                        style={{
                                            padding: '10px 15px',
                                            backgroundColor: 'red',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Deny
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
