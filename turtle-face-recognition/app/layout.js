export const metadata = {
    title: 'Turtle Face Recognition',
    description: 'Identify turtles using face recognition technology.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f9', color: '#333' }}>
                {children}
            </body>
        </html>
    );
}
