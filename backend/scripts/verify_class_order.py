"""
Verify class order consistency antara training data dan app.py
"""
import os

# Class order di app.py
APP_CLASS_NAMES = ['Black spot', 'Canker', 'Greening', 'Healthy', 'Melanose']

# Check training data folder order
data_dir = os.path.join('..', '..', 'data', 'plantvision_dataset', 'train')

if os.path.exists(data_dir):
    # Get folder names (class names from filesystem)
    folders = sorted([f for f in os.listdir(data_dir) if os.path.isdir(os.path.join(data_dir, f))])
    
    print("="*80)
    print("CLASS ORDER VERIFICATION")
    print("="*80)
    
    print("\n📂 Training data folders (sorted):")
    for i, folder in enumerate(folders):
        print(f"  {i}: {folder}")
    
    print("\n💻 app.py CLASS_NAMES:")
    for i, name in enumerate(APP_CLASS_NAMES):
        print(f"  {i}: {name}")
    
    print("\n🔍 Comparison:")
    if folders == APP_CLASS_NAMES:
        print("  ✅ CLASS ORDER MATCH! Model dan app.py konsisten.")
    else:
        print("  ❌ CLASS ORDER MISMATCH!")
        print("\n  ⚠️  WARNING: Ini bisa menyebabkan prediksi salah!")
        print("  Fix: Update CLASS_NAMES di app.py sesuai urutan folder di atas.")
        
        print("\n  Suggested fix for app.py:")
        print(f"  CLASS_NAMES = {folders}")
    
    print("="*80)
else:
    print(f"❌ Training data not found at: {data_dir}")
    print("   Model mungkin di-train dengan data lain.")

