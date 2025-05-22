'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSignUp = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Send email verification
            await sendEmailVerification(user);

            // Create a Firestore document for the user
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { verified: false, admin: false });

            alert('Sign-up successful! Please check your email to verify your account.');
            router.push('/');
        } catch (error) {
            console.error('Error signing up:', error);
            alert('Failed to sign up. Check the console for details.');
        }
    };

    return (
        <div style={{
            padding: '32px',
            maxWidth: '400px',
            margin: '60px auto',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.07)'
        }}>
            <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Sign Up</h1>
            <form onSubmit={handleSignUp}>
                <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontWeight: 500 }}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '5px',
                            borderRadius: '6px',
                            border: '1px solid #bbb',
                            fontSize: '1rem'
                        }}
                        required
                    />
                </div>
                <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontWeight: 500 }}>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '5px',
                            borderRadius: '6px',
                            border: '1px solid #bbb',
                            fontSize: '1rem'
                        }}
                        required
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '12px 0',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        marginBottom: 10,
                        transition: 'background 0.2s'
                    }}
                >
                    Sign Up
                </button>
            </form>
        </div>
    );
}
