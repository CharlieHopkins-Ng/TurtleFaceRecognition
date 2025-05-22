'use client';
import Image from 'next/image';

export default function Results({ results }) {
    if (!results || results.length === 0) {
        return <p>No matches found.</p>;
    }

    return (
        <div>
            <h2>Results</h2>
            {results.map(match => (
                <div key={match.id}>
                    <Image src={match.image} alt={`Turtle ${match.id}`} width={100} height={100} />
                    <p>{match.id}: {Math.round(match.score * 100)}%</p>
                </div>
            ))}
        </div>
    );
}
