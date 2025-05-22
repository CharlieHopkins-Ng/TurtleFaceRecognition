'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Import the auth instance
import { useRouter } from 'next/navigation';

export default function LogIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogIn = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            if (!user.emailVerified) {
                alert('Please verify your email before logging in.');
                return;
            }
            alert('Log-in successful!');
            router.push('/');
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Failed to log in. Check the console for details.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h1>Log In</h1>
            <form onSubmit={handleLogIn}>
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
                    Log In
                </button>
            </form>
        </div>
    );
}
