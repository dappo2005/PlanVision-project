import json
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

# Load history
history_path = Path("../models/efficientnet_saved/history.json")
with open(history_path, 'r') as f:
    history = json.load(f)

# Create plots
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Plot Accuracy
epochs = range(1, len(history['accuracy']) + 1)
axes[0].plot(epochs, history['accuracy'], 'b-', label='Train Accuracy', marker='o')
axes[0].plot(epochs, history['val_accuracy'], 'r-', label='Val Accuracy', marker='s')
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('Accuracy')
axes[0].set_title('Model Accuracy')
axes[0].legend()
axes[0].grid(True)

# Plot Loss
axes[1].plot(epochs, history['loss'], 'b-', label='Train Loss', marker='o')
axes[1].plot(epochs, history['val_loss'], 'r-', label='Val Loss', marker='s')
axes[1].set_xlabel('Epoch')
axes[1].set_ylabel('Loss')
axes[1].set_title('Model Loss')
axes[1].legend()
axes[1].grid(True)

plt.tight_layout()
plt.savefig("training_history.png", dpi=100, bbox_inches='tight')
print("✅ Plot saved as 'training_history.png'")
plt.show()

# Print summary
print("\n" + "="*50)
print("TRAINING SUMMARY")
print("="*50)
print(f"Epochs: {len(history['accuracy'])}")
print(f"\nFinal Metrics:")
print(f"  Train Accuracy: {history['accuracy'][-1]:.2%}")
print(f"  Val Accuracy:   {history['val_accuracy'][-1]:.2%}")
print(f"  Train Loss:     {history['loss'][-1]:.4f}")
print(f"  Val Loss:       {history['val_loss'][-1]:.4f}")
print("="*50)
