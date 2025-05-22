'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useRouter } from 'next/navigation';

export default function LogIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
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

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            alert('Password reset email sent. Please check your inbox.');
            setShowReset(false);
            setResetEmail('');
        } catch (error) {
            console.error('Error sending password reset email:', error);
            alert('Failed to send password reset email. Check the console for details.');
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
            <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Log In</h1>
            <form onSubmit={handleLogIn}>
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
                    Log In
                </button>
            </form>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button
                    type="button"
                    onClick={() => setShowReset(!showReset)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#1976d2',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500
                    }}
                >
                    Forgot Password?
                </button>
            </div>
            {showReset && (
                <form onSubmit={handlePasswordReset} style={{ marginTop: '18px' }}>
                    <label style={{ fontWeight: 500 }}>
                        Enter your email to reset password:
                        <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
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
                    </label>
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            marginTop: '10px',
                            transition: 'background 0.2s'
                        }}
                    >
                        Send Reset Email
                    </button>
                </form>
            )}
        </div>
    );
}
