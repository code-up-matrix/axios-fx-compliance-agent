"""Create the prepared public repositories using an already authenticated gh CLI.

Default: print the exact plan. --apply: create NEW repositories and push source.
Never authenticates, prints credentials, overwrites repositories, or submits entries.
"""
from pathlib import Path
import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OWNER = 'code-up-matrix'
parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()
manifest = json.loads((ROOT / 'releases/repository-seeds/manifest.json').read_text())

def run(argv, cwd=None):
    return subprocess.run(argv, cwd=cwd, check=True, text=True, capture_output=True).stdout.strip()

for item in manifest['products']:
    archive = ROOT / item['archive']
    if hashlib.sha256(archive.read_bytes()).hexdigest() != item['sha256']:
        raise SystemExit(f"Checksum mismatch: {archive.name}")
    if item['proposedRepository'] != f"{OWNER}/{item['product']}-devpost-2026":
        raise SystemExit('Unexpected destination in manifest')
    print(f"Create PUBLIC {item['proposedRepository']} from {archive.name}")

if not args.apply:
    print('Plan only. Run with --apply in an environment where gh is already authenticated as code-up-matrix.')
    raise SystemExit(0)
if not shutil.which('gh') or not shutil.which('git'):
    raise SystemExit('gh and git are required. No repositories were created.')
if run(['gh', 'api', 'user', '--jq', '.login']) != OWNER:
    raise SystemExit('The authenticated GitHub account must be code-up-matrix.')

for item in manifest['products']:
    destination = item['proposedRepository']
    existing = subprocess.run(['gh', 'repo', 'view', destination, '--json', 'nameWithOwner'], capture_output=True)
    if existing.returncode == 0:
        print(f'Skipping existing repository without modifying it: {destination}')
        continue
    # A failed lookup is not treated as proof of absence. gh repo create below
    # must independently succeed; an auth/network/existing-repo error stops work.
    with tempfile.TemporaryDirectory(prefix='devpost-source-') as temp:
        with zipfile.ZipFile(ROOT / item['archive']) as archive:
            expected = item['product'] + '-devpost-2026'
            for member in archive.infolist():
                p = Path(member.filename)
                if p.is_absolute() or '..' in p.parts or p.parts[0] != expected:
                    raise SystemExit('Unsafe archive path')
            archive.extractall(temp)
        source = Path(temp) / expected
        run(['git', 'init', '-b', 'main'], source)
        run(['git', 'add', '.'], source)
        run(['git', '-c', 'user.name=code-up-matrix', '-c', 'user.email=67716991+code-up-matrix@users.noreply.github.com',
             'commit', '-m', f"Import {item['product']} with tests and source provenance"], source)
        run(['gh', 'repo', 'create', destination, '--public', '--source', str(source), '--remote', 'origin', '--push'])
        url = run(['gh', 'repo', 'view', destination, '--json', 'url', '--jq', '.url'])
        print(f'Created and pushed: {url}')
print('Repository provisioning finished. Deployment and event submission are separate steps.')
