"""
Cek urutan class names dari dataset training
"""
import os
import sys

# adjusted for new location under backend/scripts
data_dir = os.path.join('..', '..', 'data', 'plantvision_dataset', 'train')

if not os.path.exists(data_dir):
    print(f"Error: Dataset not found at {data_dir}")
    sys.exit(1)

# Get class names (sorted alphabetically - same as TensorFlow default)
class_names = sorted([d for d in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, d))])

print("=== ACTUAL CLASS ORDER FROM DATASET ===")
for i, name in enumerate(class_names):
    print(f"  Index {i}: {name}")

print("\n=== CLASS ORDER IN APP.PY ===")
app_classes = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']
for i, name in enumerate(app_classes):
    print(f"  Index {i}: {name}")

print("\n=== COMPARISON ===")
if class_names == app_classes:
    print("✅ Class order MATCH! Model should work correctly.")
else:
    print("❌ Class order MISMATCH! This is the problem!")
    print("\n🔧 FIX NEEDED:")
    print("Update CLASS_NAMES in app.py to:")
    print(f"CLASS_NAMES = {class_names}")
