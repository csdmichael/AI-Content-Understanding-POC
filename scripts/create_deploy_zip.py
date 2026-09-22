"""
Create clean deployment zip using Python zipfile with POSIX paths
"""
import os
import zipfile

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ZIP_OUT = os.path.join(ROOT_DIR, 'deploy-package.zip')

INCLUDE_FILES = [
    'server.js',
    'web.config',
    'package.json'
]

INCLUDE_DIRS = [
    'docs',
    'data',
    'public',
    'node_modules'
]

print(f"Creating deploy package: {ZIP_OUT}...")

if os.path.exists(ZIP_OUT):
    os.remove(ZIP_OUT)

with zipfile.ZipFile(ZIP_OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    # Add root files
    for f in INCLUDE_FILES:
        fp = os.path.join(ROOT_DIR, f)
        if os.path.exists(fp):
            zf.write(fp, f)
            print(f"  Added file: {f}")

    # Add directories
    for d in INCLUDE_DIRS:
        dp_full = os.path.join(ROOT_DIR, d)
        if os.path.exists(dp_full):
            for root, dirs, files in os.walk(dp_full):
                # skip git or cache folders if any
                dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', '.pytest_cache']]
                for f in files:
                    if f.endswith('.pyc'):
                        continue
                    file_path = os.path.join(root, f)
                    rel_path = os.path.relpath(file_path, ROOT_DIR).replace('\\', '/')
                    zf.write(file_path, rel_path)
            print(f"  Added directory: {d}")

size_mb = os.path.getsize(ZIP_OUT) / (1024 * 1024)
print(f"Deployment package created successfully: {size_mb:.2f} MB")
