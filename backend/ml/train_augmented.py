"""
Training dengan Data Augmentation untuk handle class imbalance
"""
import os
import argparse
import json
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras.applications import efficientnet
import numpy as np

def parse_args():
    p = argparse.ArgumentParser()
    # adjusted defaults for new location under backend/ml
    p.add_argument('--data_dir', type=str, default=os.path.join('..', '..', 'data', 'plantvision_dataset'))
    p.add_argument('--model_dir', type=str, default=os.path.join('..', '..', 'models', 'efficientnet_saved'))
    p.add_argument('--img_size', type=int, default=224)
    p.add_argument('--batch_size', type=int, default=16)
    p.add_argument('--epochs', type=int, default=50)
    p.add_argument('--seed', type=int, default=42)
    p.add_argument('--learning_rate', type=float, default=0.0001)
    return p.parse_args()

def create_augmentation_layer():
    """Data augmentation untuk increase diversity"""
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.3),
        layers.RandomZoom(0.2),
        layers.RandomContrast(0.2),
        layers.RandomBrightness(0.2),
    ])

def prepare_datasets(data_dir, img_size=224, batch_size=16, seed=42):
    train_dir = os.path.join(data_dir, 'train')
    val_dir = os.path.join(data_dir, 'val')
    
    print('Building datasets with augmentation...')
    
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
    
    class_names = train_ds.class_names
    print(f'Detected classes: {class_names}')
    
    # Normalization
    normalization = layers.Rescaling(1./255)
    train_ds = train_ds.map(lambda x, y: (normalization(x), y))
    val_ds = val_ds.map(lambda x, y: (normalization(x), y))
    
    # Add augmentation ONLY to training set
    augmentation = create_augmentation_layer()
    train_ds = train_ds.map(lambda x, y: (augmentation(x, training=True), y))
    
    # Performance optimization
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)
    
    return train_ds, val_ds, class_names

def build_model(num_classes, img_size=224, learning_rate=0.0001):
    """Build EfficientNetB0 model"""
    base_model = efficientnet.EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=(img_size, img_size, 3)
    )
    base_model.trainable = False  # Freeze base model
    
    inputs = layers.Input(shape=(img_size, img_size, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def main():
    args = parse_args()
    
    # Prepare datasets
    train_ds, val_ds, class_names = prepare_datasets(
        args.data_dir, args.img_size, args.batch_size, args.seed
    )
    
    # Build model
    model = build_model(
        num_classes=len(class_names),
        img_size=args.img_size,
        learning_rate=args.learning_rate
    )
    
    print(f'\n{model.summary()}\n')
    
    # Callbacks
    os.makedirs(args.model_dir, exist_ok=True)
    best_model_path = os.path.join(args.model_dir, 'best_model.h5')
    
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            best_model_path,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train
    print(f'\nTraining for {args.epochs} epochs...\n')
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        callbacks=callbacks
    )
    
    # Save
    saved_model_dir = os.path.join(args.model_dir, 'saved_model')
    print(f'\nSaving SavedModel to {saved_model_dir}')
    tf.saved_model.save(model, saved_model_dir)
    
    history_path = os.path.join(args.model_dir, 'history.json')
    with open(history_path, 'w') as f:
        json.dump(history.history, f, indent=2)
    
    print(f'\n✅ Training complete!')
    print(f'   Model: {saved_model_dir}')
    print(f'   Best checkpoint: {best_model_path}')
    print(f'   History: {history_path}')
    print(f'\n📊 Final Results:')
    print(f'   Train Accuracy: {history.history["accuracy"][-1]:.4f}')
    print(f'   Val Accuracy:   {history.history["val_accuracy"][-1]:.4f}')

if __name__ == '__main__':
    main()
