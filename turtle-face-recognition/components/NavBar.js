'use client';

import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAdmin } from '../src/userManagement';
import Link from 'next/link';

export default function NavBar() {
    const [user, setUser] = useState(null);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
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
                    setIsUserAdmin(false);
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
        <>
            <style jsx global>{`
                .nav-btn {
                    padding: 8px 18px;
                    background-color: #388e3c;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    transition: background 0.2s;
                    cursor: pointer;
                    display: inline-block;
                }
                .nav-btn:hover {
                    background-color: #256029;
                }
                .nav-btn.admin {
                    background-color: #1976d2;
                }
                .nav-btn.admin:hover {
                    background-color: #0d47a1;
                }
                .nav-btn.signout {
                    background-color: #d32f2f;
                }
                .nav-btn.signout:hover {
                    background-color: #a31515;
                }
            `}</style>
            <nav style={{
                backgroundColor: '#4caf50',
                padding: '16px 32px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '18px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
                <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem' }}>Turtle Face Recognition</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link href="/" passHref legacyBehavior>
                        <a className="nav-btn">Home</a>
                    </Link>
                    <Link href="/uploadImages" passHref legacyBehavior>
                        <a className="nav-btn">Upload Images</a>
                    </Link>
                    {isUserAdmin && (
                        <Link href="/admin" passHref legacyBehavior>
                            <a className="nav-btn admin">Admin</a>
                        </Link>
                    )}
                    {!user ? (
                        <>
                            <Link href="/signup" passHref legacyBehavior>
                                <a className="nav-btn">Sign Up</a>
                            </Link>
                            <Link href="/login" passHref legacyBehavior>
                                <a className="nav-btn">Log In</a>
                            </Link>
                        </>
                    ) : (
                        <button
                            onClick={handleSignOut}
                            className="nav-btn signout"
                        >
                            Sign Out
                        </button>
                    )}
                </div>
            </nav>
        </>
    );
}
