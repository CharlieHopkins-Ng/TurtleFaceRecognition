'use client';

import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAdmin } from '../src/userManagement'; // Import the isAdmin function

export default function NavBar() {
    const [user, setUser] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false); // Track if the user is an admin
    const router = useRouter();

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const adminStatus = await isAdmin(currentUser.uid);
                    setIsUserAdmin(adminStatus);
                } catch (error) {
                    console.error('Error determining admin status:', error);
                    setIsUserAdmin(false); // Default to false if an error occurs
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        const auth = getAuth();
        await signOut(auth);
        alert('You have been signed out.');
        router.push('/');
    };

    return (
        <nav style={{
            backgroundColor: '#4caf50',
            padding: '20px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '18px',
        }}>
            <h1 style={{ margin: 0 }}>Turtle Face Recognition</h1>
            <div>
                <a href="/" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Home</a>
                <a href="/uploadImages" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Upload Images</a>
                {isUserAdmin && (
                    <a href="/admin" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Admin</a>
                )}
                {!user ? (
                    <>
                        <a href="/signup" style={{ color: 'white', textDecoration: 'none', marginRight: '15px' }}>Sign Up</a>
                        <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>Log In</a>
                    </>
                ) : (
                    <button
                        onClick={handleSignOut}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: '#222',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </nav>
    );
}
