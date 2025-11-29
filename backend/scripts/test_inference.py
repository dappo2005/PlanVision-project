"""
Test inference untuk debug: cek apakah model bisa prediksi dengan benar
"""
import tensorflow as tf
import numpy as np
from PIL import Image
import os
import sys

# Class names (PENTING: harus sama urutan dengan saat training!)
CLASS_NAMES = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']

def test_model(image_path):
    """Test model dengan satu gambar"""
    
    # Load model (adjusted for new location under backend/scripts)
    model_path = os.path.join('..', '..', 'models', 'efficientnet_saved', 'saved_model')
    print(f"Loading model from: {model_path}")
    model = tf.saved_model.load(model_path)
    infer = model.signatures["serving_default"]
    
    # Load & preprocess image
    print(f"\nTesting image: {image_path}")
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # Inference
    output = infer(tf.constant(img_array, dtype=tf.float32))
    output_key = list(output.keys())[0]
    predictions_raw = output[output_key].numpy()[0]
    
    # Softmax
    from scipy.special import softmax
    predictions = softmax(predictions_raw)
    
    # Print results
    print("\n=== PREDICTION RESULTS ===")
    for i, (class_name, prob) in enumerate(zip(CLASS_NAMES, predictions)):
        marker = "👉" if i == np.argmax(predictions) else "  "
        print(f"{marker} {class_name:15s}: {prob*100:6.2f}%")
    
    print(f"\n✅ Top prediction: {CLASS_NAMES[np.argmax(predictions)]} ({predictions[np.argmax(predictions)]*100:.2f}%)")
    
    return CLASS_NAMES[np.argmax(predictions)], predictions

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_inference.py <path_to_image>")
        print("\nExample:")
        print('  python test_inference.py "../../Citrus Leaf Disease Image/Black spot/1.jpg"')
        print('  python test_inference.py "../../Citrus Leaf Disease Image/Canker/1.jpg"')
        sys.exit(1)
    
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(f"Error: Image not found: {image_path}")
        sys.exit(1)
    
    test_model(image_path)

