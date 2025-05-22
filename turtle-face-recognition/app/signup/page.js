'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig'; // Import the auth and db instances
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
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
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h1>Sign Up</h1>
            <form onSubmit={handleSignUp}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                        required
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                        required
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Sign Up
                </button>
            </form>
        </div>
    );
}
