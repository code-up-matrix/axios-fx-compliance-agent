"""Build the editable-source UGREEN Round 1 proposal; no consent is fabricated."""
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
import json, re, zipfile, hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
items = [
('01 / Purpose', 'HandoverShelf turns an approved NAS project folder into a source-linked handover brief with unresolved questions and an optional, user-approved knowledge record.'),
('02 / User and problem', 'Small project teams lose decisions across reports, meeting notes and duplicate revisions. Incoming teammates need to see what is supported, what conflicts and what still needs an owner.'),
('03 / Proposed solution', 'A Uliya Skill coordinates file discovery and document reconciliation, producing decisions, responsibilities, dates, conflicting statements and missing evidence in a reviewable brief.'),
('04 / Core flow', 'The user chooses one folder and a handover question. The Skill inventories permitted files, extracts supported statements, flags disagreements, presents source links, and asks whether the reviewed brief should be saved.'),
('05 / Difference', 'The output is a claim ledger, not just a fluent summary: each assertion retains its file identifier and available locator. Conflicting dates stay visible. Missing information becomes a question, never an invented assignment.'),
('06 / NAS capabilities', 'file-agent discovers and inspects authorized files through ug-filesystem and ug-filemgr. document-agent uses ug-document for extraction and reconciliation. After explicit approval, knowledge-agent uses ug-knowledge to save the reviewed result.'),
('07 / Technical approach', 'A declarative SKILL.md orchestrates registered experts using the official capability catalog. Inputs are an authorized folder, a question and optional time range. It uses platform-provided AI, makes no custom external-model calls and introduces no executable scripts. The workflow handles completion, failure, cancellation, waiting for the user and waiting for approval. Source data stays within the platform-authorized workflow.'),
('08 / Development status', 'The Skill, linked acceptance reference and capability mapping are implemented. The official starter checker reports static-pass with zero errors or warnings. Installation, actual expert responses, source-link rendering and persistence remain untested on NAS; no runtime success is claimed.'),
('09 / Finalist validation', 'Core test one: reconcile a synthetic folder containing three consistent project documents and check every claim against its source. Core test two: save a reviewed brief only after approval and reopen it. Edge case: conflicting dates plus an unreadable file must yield explicit uncertainty and partial results without fabricated evidence.'),
('10 / Limits and dependencies', 'Scanned or unsupported documents may not extract reliably; large folders require smaller batches. Expert availability and permission scope depend on the assigned NAS. The user remains responsible for reviewing ambiguous ownership and deadlines. Real-device validation requires finalist access.')
]
words = sum(len(re.findall(r"\S+", text)) for _, text in items)
assert words <= 500, words
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Brand', fontName='DejaVu-Bold', fontSize=10, textColor=HexColor('#4d6b5f'), spaceAfter=12))
styles.add(ParagraphStyle(name='TitleX', fontName='DejaVu-Bold', fontSize=29, leading=33, textColor=HexColor('#173b31'), spaceAfter=9))
styles.add(ParagraphStyle(name='SubX', fontName='DejaVu', fontSize=10, leading=14, textColor=HexColor('#597065'), spaceAfter=22))
styles.add(ParagraphStyle(name='HeadingX', fontName='DejaVu-Bold', fontSize=10, leading=13, textColor=HexColor('#173b31'), spaceAfter=4))
styles.add(ParagraphStyle(name='BodyX', fontName='DejaVu', fontSize=10.5, leading=15.5, textColor=HexColor('#263d35'), spaceAfter=18))
styles.add(ParagraphStyle(name='FineX', fontName='DejaVu', fontSize=8, leading=11, textColor=HexColor('#597065'), spaceAfter=8))
story = [Paragraph('CODEMATRIX / UGREEN AI NAS / ROUND 1', styles['Brand']), Paragraph('HandoverShelf', styles['TitleX']), Paragraph('An evidence-linked handover, built around the files your team already owns.<br/>Proposal draft | Automate Your Workflow | 27 October 2026', styles['SubX'])]
for idx, (heading, text) in enumerate(items):
    if idx == 5:
        story.extend([PageBreak(), Paragraph("HANDOVERSHELF / TECHNICAL PLAN", styles["Brand"])])
    story.append(KeepTogether([Paragraph(heading, styles['HeadingX']), Paragraph(text, styles['BodyX'])]))
story.extend([Spacer(1, 8), Paragraph('Components and authorship', styles['HeadingX']), Paragraph('Official UGREEN Skill Developer Package 0.7.3 and capability catalog 2.0.0 were used as development references under the applicable UGREEN package terms. Source: https://ai.ugreen.com/pages/hackathon-starter-kit. The starter is not redistributed. Authored Skill content is MIT-licensed. No external service is added by this Skill. Development and this proposal were assisted by ChatGPT/Codex; the entrant must review and own the final work.', styles['FineX']), Paragraph('Participant completion before submission', styles['HeadingX']), Paragraph('Entrant identity, eligibility, team membership, required consent declarations and electronic signatures must be completed personally in the organizer\'s required form. This draft contains no signature or assertion that those declarations have been accepted.', styles['FineX'])])
def footer(canvas, doc):
    canvas.setStrokeColor(HexColor('#d6dfd4')); canvas.line(48, 45, 547, 45)
    canvas.setFont('DejaVu', 8); canvas.setFillColor(HexColor('#597065'))
    canvas.drawString(48, 30, f'Pre-test proposal / {words} words in substantive responses / NAS validation pending')
    canvas.drawRightString(547, 30, str(doc.page))
pdf = OUT / 'handovershelf-round1-proposal.pdf'
SimpleDocTemplate(str(pdf), pagesize=(595, 842), rightMargin=48, leftMargin=48, topMargin=44, bottomMargin=58, title='HandoverShelf - UGREEN Round 1 Proposal', author='CodeMatrix').build(story, onFirstPage=footer, onLaterPages=footer)
assert pdf.stat().st_size < 1_000_000
release = ROOT / 'native/handovershelf/releases'
release.mkdir(parents=True, exist_ok=True)
skillroot = ROOT / 'native/handovershelf/handover-shelf'
zpath = release / 'handover-shelf-1.0.0.zip'
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as archive:
    for f in sorted(skillroot.rglob('*.md')):
        entry = zipfile.ZipInfo(str(f.relative_to(skillroot)), date_time=(2026,10,27,0,0,0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(entry, f.read_bytes())
manifest = {'substantive_words': words, 'nas_runtime_verified': False, 'artifacts': [{'path':str(p.relative_to(ROOT)), 'bytes':p.stat().st_size, 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [pdf,zpath]]}
(release / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps(manifest, indent=2))
