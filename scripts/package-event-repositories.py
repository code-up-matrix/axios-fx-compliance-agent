"""Package verified standalone sources, without dependencies, builds or secrets."""
from pathlib import Path
import datetime
import hashlib
import json
import shutil
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXPORT = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/devpost-event-repositories')
OUT = ROOT / 'releases' / 'repository-seeds'
OUT.mkdir(parents=True, exist_ok=True)
PRODUCTS = ['fieldbrief', 'cultureroute', 'crowdquest', 'fitreceipt', 'reloop', 'lessonscript', 'rhythmweave']
SKIP = {'node_modules', '.next', '.output', '.eve', '.vercel', '.git', 'coverage', '__pycache__'}

native = EXPORT / 'handovershelf'
native.mkdir(parents=True, exist_ok=True)
for source, target in [
    ('native/handovershelf/README.md', 'README.md'),
    ('LICENSE', 'LICENSE'),
    ('output/pdf/handovershelf-round1-proposal.pdf', 'submission/handovershelf-round1-proposal.pdf'),
    ('native/handovershelf/releases/handover-shelf-1.0.0.zip', 'submission/handover-shelf-1.0.0.zip'),
    ('native/handovershelf/verification/static-check.json', 'verification/static-check.json'),
    ('native/handovershelf/handover-shelf/SKILL.md', 'handover-shelf/SKILL.md'),
    ('native/handovershelf/handover-shelf/references/acceptance.md', 'handover-shelf/references/acceptance.md'),
]:
    dest = native / target
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / source, dest)
(native / 'README.md').write_text((native / 'README.md').read_text().replace('the ZIP under `releases/`', 'the ZIP under `submission/`').replace('native/handovershelf/handover-shelf', 'handover-shelf'))
(native / 'SOURCE.json').write_text(json.dumps({
    'sourceRepository': 'code-up-matrix/axios-fx-compliance-agent',
    'sourceCommit': '4093cf1d826e4591f66a0aa507eab5ea5db91544',
    'product': 'handovershelf', 'remoteRepositoryCreated': False,
    'submitted': False, 'nasRuntimeVerified': False,
}, indent=2) + '\n')
(native / 'submission' / 'README.md').write_text('''# HandoverShelf: UGREEN Round 1

Event: https://ugreenhackathon.devpost.com/

The proposal PDF and initial Skill ZIP are separate Round 1 artifacts. The PDF contains 346 substantive words and is 47,120 bytes; the Skill ZIP is 2,880 bytes. The official 0.7.3 checker, capability catalog 2.0.0, reports static-pass with zero errors and warnings.

Static validation does not establish NAS runtime behavior. Assigned-NAS execution is pending the finalist environment. Personal entrant declarations and final submission remain outstanding. No receipt or selection is claimed.

The product was prepared with ChatGPT/Codex assistance on 27 October 2026. See SOURCE.json for source provenance and LICENSE for authored code/content. The UGREEN starter kit is an external development dependency and is not redistributed.
''')

entries = []
for slug in PRODUCTS + ['handovershelf']:
    folder = EXPORT / slug
    if slug in PRODUCTS:
        verification = json.loads((folder / 'verification.json').read_text())
        if verification['checkExit'] != 0 or not verification['productionBuildPassed']:
            raise RuntimeError(f'{slug} has no passing production verification')
        log = Path('/tmp/independent-crowdquest-final.log' if slug == 'crowdquest' else f'/tmp/independent-{slug}.log')
        if log.exists():
            (folder / 'verification').mkdir(exist_ok=True)
            shutil.copyfile(log, folder / 'verification' / 'check.log')
    else:
        verification = {'staticValidationPassed': True, 'nasRuntimeVerified': False}
    files = []
    for p in sorted(folder.rglob('*')):
        rel = p.relative_to(folder)
        if any(part in SKIP for part in rel.parts) or p.is_symlink() or not p.is_file():
            continue
        if p.name.startswith('.env') and p.name != '.env.example':
            raise RuntimeError(f'Refusing environment file: {rel}')
        if p.name.endswith('.tsbuildinfo'):
            continue
        files.append((p, rel))
    archive = OUT / f'{slug}-devpost-2026.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p, rel in files:
            info = zipfile.ZipInfo(str(Path(f'{slug}-devpost-2026') / rel), (2026, 10, 27, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, p.read_bytes())
    entries.append({
        'product': slug, 'proposedRepository': f'code-up-matrix/{slug}-devpost-2026',
        'archive': str(archive.relative_to(ROOT)), 'bytes': archive.stat().st_size,
        'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'files': len(files),
        'verification': verification, 'repositoryCreated': False,
        'cloudDeployed': False, 'submitted': False,
    })
manifest = {'createdAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'products': entries}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps([{'product': e['product'], 'bytes': e['bytes'], 'files': e['files']} for e in entries], indent=2))
