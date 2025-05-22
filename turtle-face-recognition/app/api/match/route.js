import { cosineSimilarity } from '../../../utils/similarity';

export async function POST(req) {
    const { embedding, database } = await req.json();
    const matches = database
        .map(entry => ({
            id: entry.id,
            image: entry.image,
            score: cosineSimilarity(embedding, entry.embedding),
        }))
        .filter(match => match.score >= 0.7)
        .sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify(matches), { status: 200 });
}
