import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model;

/**
 * Load the MobileNet model.
 */
export async function loadModel() {
    if (!model) {
        model = await mobilenet.load({ version: 2, alpha: 1.0 });
    }
}

/**
 * Generate an embedding for an image.
 * @param {HTMLImageElement} img - The image element.
 * @returns {number[]} - The embedding array.
 */
export async function getEmbedding(img) {
    if (!model) {
        await loadModel();
    }
    const tensor = tf.browser.fromPixels(img)
        .resizeBilinear([224, 224])
        .toFloat()
        .expandDims();
    const embedding = model.infer(tensor, true).arraySync()[0];
    tensor.dispose();
    return embedding;
}