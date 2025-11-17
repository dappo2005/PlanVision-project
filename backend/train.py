"""
Training script for Citrus Leaf Disease classification using TensorFlow Keras.

Usage (example):
  python train.py \
    --data_dir "../data/plantvision_dataset" \
    --model_dir "../models/efficientnet_saved" \
    --img_size 224 \
    --batch_size 32 \
    --epochs 20

Notes:
- This script is CPU-friendly by default but training on CPU will be slower.
- If TensorFlow is not installed, the script will print instructions and exit.
- The dataset directory is expected to have the structure:
    data/plantvision_dataset/
      train/<class>/*.jpg
      val/<class>/*.jpg
      test/<class>/*.jpg

The script will:
- Build tf.data datasets for train/val/test
- Create a transfer learning model (EfficientNetB0) and train it
- Save the best model (SavedModel format) to model_dir
- Save training history to model_dir/history.json
"""

import os
import argparse
import json
import datetime

# Try to import heavy dependencies; fail gracefully with message
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.preprocessing import image_dataset_from_directory
    from tensorflow.keras.applications import efficientnet
except Exception as e:
    print("TensorFlow import failed:", e)
    print("\nPlease install the ML requirements first. Example:\n  pip install -r backend/requirements-ml.txt")
    raise SystemExit(1)

try:
    from sklearn.utils.class_weight import compute_class_weight
    import numpy as np
except Exception:
    compute_class_weight = None
    np = None


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data_dir', type=str, default=os.path.join('..', 'data', 'plantvision_dataset'))
    p.add_argument('--model_dir', type=str, default=os.path.join('..', 'models', 'efficientnet_saved'))
    p.add_argument('--img_size', type=int, default=224)
    p.add_argument('--batch_size', type=int, default=32)
    p.add_argument('--epochs', type=int, default=20)
    p.add_argument('--seed', type=int, default=42)
    p.add_argument('--learning_rate', type=float, default=1e-3)
    p.add_argument('--fine_tune_at', type=int, default=None, help='If set, unfreeze model layers from this index for fine-tuning')
    return p.parse_args()


def prepare_datasets(data_dir, img_size=224, batch_size=32, seed=42):
    train_dir = os.path.join(data_dir, 'train')
    val_dir = os.path.join(data_dir, 'val')
    test_dir = os.path.join(data_dir, 'test')

    if not os.path.exists(train_dir) or not os.path.exists(val_dir) or not os.path.exists(test_dir):
        raise FileNotFoundError('Expected train/val/test directories under data_dir.\nPlease run the create_split step or provide the correct path.')

    print('Building datasets from:')
    print('  train:', train_dir)
    print('  val:  ', val_dir)
    print('  test: ', test_dir)

    train_ds = image_dataset_from_directory(
        train_dir,
        labels='inferred',
        label_mode='int',
        batch_size=batch_size,
        image_size=(img_size, img_size),
        shuffle=True,
        seed=seed
    )

    val_ds = image_dataset_from_directory(
        val_dir,
        labels='inferred',
        label_mode='int',
        batch_size=batch_size,
        image_size=(img_size, img_size),
        shuffle=False
    )

    test_ds = image_dataset_from_directory(
        test_dir,
        labels='inferred',
        label_mode='int',
        batch_size=batch_size,
        image_size=(img_size, img_size),
        shuffle=False
    )

    class_names = train_ds.class_names
    print('Detected classes:', class_names)

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)
    test_ds = test_ds.prefetch(buffer_size=AUTOTUNE)

    return train_ds, val_ds, test_ds, class_names


def get_class_weights(train_dir, class_names):
    if compute_class_weight is None:
        print('scikit-learn not available; skipping class weight computation')
        return None

    # build labels array from folder counts
    counts = []
    labels = []
    for idx, c in enumerate(class_names):
        c_dir = os.path.join(train_dir, c)
        n = 0
        for root, _, files in os.walk(c_dir):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif')):
                    labels.append(idx)
                    n += 1
        counts.append(n)

    if not labels:
        return None

    labels = np.array(labels)
    class_weights = compute_class_weight('balanced', classes=np.arange(len(class_names)), y=labels)
    class_weights_dict = {i: float(w) for i, w in enumerate(class_weights)}
    print('Computed class weights:', class_weights_dict)
    return class_weights_dict


def build_model(num_classes, img_size=224, learning_rate=1e-3):
    inputs = layers.Input(shape=(img_size, img_size, 3))
    # Use EfficientNetB0 base
    base_model = efficientnet.EfficientNetB0(include_top=False, weights='imagenet', input_tensor=inputs)
    base_model.trainable = False

    x = layers.GlobalAveragePooling2D()(base_model.output)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)

    model = models.Model(inputs=inputs, outputs=outputs)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model, base_model


def main():
    args = parse_args()

    train_ds, val_ds, test_ds, class_names = prepare_datasets(args.data_dir, args.img_size, args.batch_size, args.seed)
    num_classes = len(class_names)

    model, base_model = build_model(num_classes, args.img_size, args.learning_rate)

    # callbacks and directories
    os.makedirs(args.model_dir, exist_ok=True)
    now = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    checkpoint_path = os.path.join(args.model_dir, 'best_model.h5')
    saved_model_dir = os.path.join(args.model_dir, 'saved_model')

    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(checkpoint_path, monitor='val_accuracy', save_best_only=True, verbose=1),
        tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=6, restore_best_weights=True, verbose=1),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1)
    ]

    # compute class weights if possible
    train_dir = os.path.join(args.data_dir, 'train')
    class_weights = get_class_weights(train_dir, class_names) if np is not None else None

    print('\nTraining head (base model frozen)')
    history_head = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=max(1, args.epochs // 2),
        callbacks=callbacks,
        class_weight=class_weights
    )

    # fine-tune if requested
    if args.fine_tune_at is not None:
        print(f'Unfreezing layers from {args.fine_tune_at} for fine-tuning')
        base_model.trainable = True
        for layer in base_model.layers[:args.fine_tune_at]:
            layer.trainable = False
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=args.learning_rate/10),
                      loss='sparse_categorical_crossentropy', metrics=['accuracy'])

        history_finetune = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=args.epochs,
            callbacks=callbacks,
            class_weight=class_weights
        )
    else:
        print('Skipping fine-tuning (fine_tune_at not set)')

    # Save final model (SavedModel)
    try:
        print('Saving SavedModel to', saved_model_dir)
        model.save(saved_model_dir, include_optimizer=False)
    except Exception as e:
        print('Error saving SavedModel:', e)

    # Save history to JSON
    history = {}
    for k, v in model.history.history.items():
        history[k] = [float(x) for x in v]
    hist_path = os.path.join(args.model_dir, 'history.json')
    with open(hist_path, 'w') as f:
        json.dump(history, f, indent=2)

    print('\nTraining complete. Model and history saved to', args.model_dir)


if __name__ == '__main__':
    main()
