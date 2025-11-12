import os
from collections import defaultdict

DATASET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'Citrus Leaf Disease Image'))

print('Checking dataset at:', DATASET_DIR)

if not os.path.exists(DATASET_DIR):
    print('ERROR: dataset folder not found. Please check path and try again.')
    raise SystemExit(1)

# Find top-level class folders or subfolders depending on structure
classes = []
counts = defaultdict(int)

# Look for class folders directly under dataset dir
for entry in sorted(os.listdir(DATASET_DIR)):
    path = os.path.join(DATASET_DIR, entry)
    if os.path.isdir(path):
        # Count files under this folder (recursively)
        cnt = 0
        for root, _, files in os.walk(path):
            for f in files:
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif')):
                    cnt += 1
        classes.append(entry)
        counts[entry] = cnt

if not classes:
    print('No class subfolders detected directly under dataset folder. Listing top-level entries:')
    for e in os.listdir(DATASET_DIR):
        print(' -', e)
    print('\nIf your images are nested differently (e.g. inside a single folder), tell me the exact path or restructure into class subfolders.')
else:
    total = sum(counts.values())
    print(f'Found {len(classes)} class folders, total images: {total}\n')
    for c in classes:
        print(f' - {c}: {counts[c]} images')

    # Check if there is an existing train/val/test split structure
    split_names = ['train', 'val', 'test']
    split_found = {s: [] for s in split_names}
    for s in split_names:
        s_path = os.path.join(DATASET_DIR, s)
        if os.path.isdir(s_path):
            # list classes under split
            for entry in sorted(os.listdir(s_path)):
                p = os.path.join(s_path, entry)
                if os.path.isdir(p):
                    cnt = 0
                    for root, _, files in os.walk(p):
                        for f in files:
                            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif')):
                                cnt += 1
                    split_found[s].append((entry, cnt))

    any_split = any(split_found[s] for s in split_names)
    if any_split:
        print('\nDetected existing split directories:')
        for s in split_names:
            if split_found[s]:
                print(f' {s}:')
                for cls, cnt in split_found[s]:
                    print(f'   - {cls}: {cnt}')
    else:
        print('\nNo explicit train/val/test split detected. I can create a stratified split (default 70/15/15) for you if you want.')

    # Show example file paths for first class
    first = classes[0]
    print('\nShowing up to 5 example image files from class', first)
    shown = 0
    for root, _, files in os.walk(os.path.join(DATASET_DIR, first)):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif')):
                print(' -', os.path.join(root, f))
                shown += 1
                if shown >= 5:
                    break
        if shown >= 5:
            break

print('\nDataset check complete.')
