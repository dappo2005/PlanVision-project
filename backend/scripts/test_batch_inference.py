"""
Test batch inference: Test model dengan multiple images dari setiap class
untuk cek accuracy dan confusion matrix
"""
import tensorflow as tf
import numpy as np
from PIL import Image
import os
import glob
from collections import defaultdict

# Class names (HARUS SAMA dengan urutan saat training!)
CLASS_NAMES = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']

def test_batch():
    """Test model dengan batch images dari semua kelas"""
    
    # Load model
    model_path = os.path.join('..', '..', 'models', 'efficientnet_saved', 'saved_model')
    print(f"Loading model from: {model_path}")
    model = tf.saved_model.load(model_path)
    infer = model.signatures["serving_default"]
    
    # Base path untuk test images
    base_path = os.path.join('..', '..', 'Citrus Leaf Disease Image')
    
    # Hasil test per kelas
    results = defaultdict(lambda: {'correct': 0, 'total': 0, 'predictions': []})
    
    print("\n" + "="*80)
    print("TESTING MODEL DENGAN BATCH IMAGES")
    print("="*80)
    
    # Test setiap kelas
    for true_class in CLASS_NAMES:
        class_dir = os.path.join(base_path, true_class)
        
        if not os.path.exists(class_dir):
            print(f"⚠️  Directory not found: {class_dir}")
            continue
        
        # Ambil max 10 images per kelas untuk testing
        image_files = glob.glob(os.path.join(class_dir, '*.png'))[:10]
        image_files += glob.glob(os.path.join(class_dir, '*.jpg'))[:10-len(image_files)]
        
        print(f"\n📂 Testing class: {true_class} ({len(image_files)} images)")
        
        for img_path in image_files:
            try:
                # Load & preprocess
                img = Image.open(img_path).convert('RGB')
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
                
                # Get prediction
                pred_idx = np.argmax(predictions)
                pred_class = CLASS_NAMES[pred_idx]
                confidence = predictions[pred_idx]
                
                # Check correctness
                is_correct = (pred_class == true_class)
                results[true_class]['total'] += 1
                if is_correct:
                    results[true_class]['correct'] += 1
                
                results[true_class]['predictions'].append({
                    'image': os.path.basename(img_path),
                    'predicted': pred_class,
                    'confidence': confidence,
                    'correct': is_correct
                })
                
                # Print result
                status = "✅" if is_correct else "❌"
                print(f"  {status} {os.path.basename(img_path):30s} -> {pred_class:15s} ({confidence*100:.1f}%)")
                
            except Exception as e:
                print(f"  ⚠️  Error processing {img_path}: {e}")
    
    # Print summary
    print("\n" + "="*80)
    print("SUMMARY - ACCURACY PER CLASS")
    print("="*80)
    
    total_correct = 0
    total_images = 0
    
    for class_name in CLASS_NAMES:
        if results[class_name]['total'] > 0:
            accuracy = (results[class_name]['correct'] / results[class_name]['total']) * 100
            correct = results[class_name]['correct']
            total = results[class_name]['total']
            
            print(f"{class_name:15s}: {correct:2d}/{total:2d} correct = {accuracy:5.1f}% accuracy")
            
            total_correct += correct
            total_images += total
    
    # Overall accuracy
    if total_images > 0:
        overall_accuracy = (total_correct / total_images) * 100
        print(f"\n{'OVERALL':15s}: {total_correct:2d}/{total_images:2d} correct = {overall_accuracy:5.1f}% accuracy")
    
    print("="*80)
    
    # Print common misclassifications
    print("\n" + "="*80)
    print("COMMON MISCLASSIFICATIONS")
    print("="*80)
    
    for true_class in CLASS_NAMES:
        wrong_predictions = [p for p in results[true_class]['predictions'] if not p['correct']]
        
        if wrong_predictions:
            print(f"\n❌ {true_class} misclassified as:")
            
            # Count misclassifications
            misclass_counts = defaultdict(int)
            for p in wrong_predictions:
                misclass_counts[p['predicted']] += 1
            
            for pred_class, count in sorted(misclass_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"   -> {pred_class:15s}: {count} times")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    test_batch()

