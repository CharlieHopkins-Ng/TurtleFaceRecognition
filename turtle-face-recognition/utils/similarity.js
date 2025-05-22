/**
 * Calculate cosine similarity between two vectors.
 * @param {number[]} a - First vector.
 * @param {number[]} b - Second vector.
 * @returns {number} - Cosine similarity score.
 */
export function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai ** 2, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi ** 2, 0));
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0; // Avoid division by zero
}

/**
 * Find the most similar embeddings from a database.
 * @param {number[]} targetEmbedding - The embedding to match.
 * @param {Array} database - The database of embeddings.
 * @param {number} topN - Number of top matches to return.
 * @returns {Array} - Sorted matches with similarity scores.
 */
export function findBestMatches(targetEmbedding, database, topN = 3) {
    if (!targetEmbedding) {
        throw new Error('Target embedding is required.');
    }

    const validEntries = database.filter(entry => entry.embedding); // Filter out entries without embeddings

    if (validEntries.length === 0) {
        console.warn('No valid embeddings found in the database.');
        return [];
    }

    const scores = validEntries.map(entry => {
        const embedding = JSON.parse(entry.embedding); // Parse the embedding string
        const score = cosineSimilarity(targetEmbedding, embedding); // Calculate similarity
        return { ...entry, score };
    });

    // Sort by similarity score in descending order and return the top N matches
    return scores.sort((a, b) => b.score - a.score).slice(0, topN);
}