import os
import shutil
import random
from math import floor

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC_DATASET = os.path.join(BASE_DIR, 'Citrus Leaf Disease Image')
DEST_DATASET = os.path.join(BASE_DIR, 'data', 'plantvision_dataset')

# Split ratios
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

RANDOM_SEED = 42

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.bmp', '.gif')


def gather_class_files(src_dir):
    classes = {}
    for entry in sorted(os.listdir(src_dir)):
        path = os.path.join(src_dir, entry)
        if os.path.isdir(path):
            files = []
            for root, _, filenames in os.walk(path):
                for f in filenames:
                    if f.lower().endswith(IMAGE_EXTS):
                        files.append(os.path.join(root, f))
            if files:
                classes[entry] = files
    return classes


def make_dirs(dest_base, splits, classes):
    for s in splits:
        for c in classes:
            d = os.path.join(dest_base, s, c)
            os.makedirs(d, exist_ok=True)


def split_and_copy(classes_files, dest_base, train_ratio=0.7, val_ratio=0.15, test_ratio=0.15, seed=42):
    random.seed(seed)
    stats = {}
    for cls, files in classes_files.items():
        files = sorted(files)
        random.shuffle(files)
        n = len(files)
        n_train = int(floor(n * train_ratio))
        n_val = int(floor(n * val_ratio))
        n_test = n - n_train - n_val

        train_files = files[:n_train]
        val_files = files[n_train:n_train + n_val]
        test_files = files[n_train + n_val:]

        dest_train = os.path.join(dest_base, 'train', cls)
        dest_val = os.path.join(dest_base, 'val', cls)
        dest_test = os.path.join(dest_base, 'test', cls)

        for src in train_files:
            shutil.copy2(src, dest_train)
        for src in val_files:
            shutil.copy2(src, dest_val)
        for src in test_files:
            shutil.copy2(src, dest_test)

        stats[cls] = {
            'total': n,
            'train': len(train_files),
            'val': len(val_files),
            'test': len(test_files)
        }
    return stats


if __name__ == '__main__':
    print('Source dataset:', SRC_DATASET)
    print('Destination dataset:', DEST_DATASET)

    if not os.path.exists(SRC_DATASET):
        print('ERROR: source dataset not found. Aborting.')
        raise SystemExit(1)

    classes_files = gather_class_files(SRC_DATASET)
    if not classes_files:
        print('No class folders with images found in source. Aborting.')
        raise SystemExit(1)

    splits = ['train', 'val', 'test']
    make_dirs(DEST_DATASET, splits, classes_files.keys())

    print('Splitting and copying files...')
    stats = split_and_copy(classes_files, DEST_DATASET, TRAIN_RATIO, VAL_RATIO, TEST_RATIO, RANDOM_SEED)

    print('\nSplit results:')
    total_all = 0
    total_train = total_val = total_test = 0
    for cls, s in stats.items():
        print(f" - {cls}: total={s['total']}, train={s['train']}, val={s['val']}, test={s['test']}")
        total_all += s['total']
        total_train += s['train']
        total_val += s['val']
        total_test += s['test']

    print('\nTotals:')
    print(f'  all images: {total_all}')
    print(f'  train: {total_train}')
    print(f'  val: {total_val}')
    print(f'  test: {total_test}')

    print('\nQuick verification of destination folders:')
    for split in splits:
        print(f'Contents of {split}:')
        for cls in sorted(classes_files.keys()):
            p = os.path.join(DEST_DATASET, split, cls)
            cnt = 0
            if os.path.exists(p):
                for _, _, files in os.walk(p):
                    for f in files:
                        if f.lower().endswith(IMAGE_EXTS):
                            cnt += 1
            print(f'  - {cls}: {cnt}')

    print('\nDataset split and copy complete.')
