"""
Rename Arlen → Arlan across all project files.
Handles: Arlen, ARLEN, arlen variations.
"""
import os, glob

DIR = r"c:\Users\Chris\Desktop\WEBSITES\ARLEN, LLC"

# Files to process
extensions = ["*.html", "*.css", "*.js", "*.json", "*.py", "*.md"]
skip_files = {"fix_encoding.py", "generate_audio.py", "rename_arlen.py", "package-lock.json"}

replacements = [
    ("Arlen", "Arlan"),
    ("ARLEN", "ARLAN"),
    ("arlen", "arlan"),
]

total_changes = 0

for ext in extensions:
    for fpath in glob.glob(os.path.join(DIR, "**", ext), recursive=True):
        fname = os.path.basename(fpath)
        if fname in skip_files or ".netlify" in fpath or "node_modules" in fpath:
            continue
        
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
        except:
            continue
        
        original = content
        for old, new in replacements:
            content = content.replace(old, new)
        
        if content != original:
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            changes = sum(original.count(old) for old, _ in replacements)
            print(f"  FIXED: {os.path.relpath(fpath, DIR)} ({changes} replacements)")
            total_changes += changes

# Rename audio files
audio_dir = os.path.join(DIR, "assets", "audio")
if os.path.isdir(audio_dir):
    for f in os.listdir(audio_dir):
        if "arlen" in f:
            old_path = os.path.join(audio_dir, f)
            new_name = f.replace("arlen", "arlan")
            new_path = os.path.join(audio_dir, new_name)
            os.rename(old_path, new_path)
            print(f"  RENAMED: {f} -> {new_name}")
            total_changes += 1

print(f"\nDone! {total_changes} total changes across all files.")
