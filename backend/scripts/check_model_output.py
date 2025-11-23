"""
Script untuk cek output keys dari SavedModel
"""
import tensorflow as tf
import os

# adjusted for new location under backend/scripts
model_path = os.path.join('..', '..', 'models', 'efficientnet_saved', 'saved_model')
print(f"Loading model from: {model_path}")

model = tf.saved_model.load(model_path)
infer = model.signatures['serving_default']

print("\n=== MODEL SIGNATURE INFO ===")
print(f"Input keys: {list(infer.structured_input_signature[1].keys())}")
print(f"Output keys: {list(infer.structured_outputs.keys())}")

print("\n=== OUTPUT DETAILS ===")
for key, value in infer.structured_outputs.items():
    print(f"  {key}: shape={value.shape}, dtype={value.dtype}")

print("\n✅ Use this output key in app.py:")
output_key = list(infer.structured_outputs.keys())[0]
print(f"   predictions_raw = output['{output_key}'].numpy()[0]")

