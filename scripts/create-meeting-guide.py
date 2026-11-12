"""Build the one-page, firm-facing demonstration guide."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'M_Law_Meeting_Guide.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(OUT), pagesize=(612, 792))
c.setTitle('M Law | Connected Office Meeting Guide')
c.setAuthor('M Law Prototype')
green, ink, muted = '#143D35', '#193F37', '#566961'
c.setFillColor(HexColor('#F5F3EB')); c.rect(0, 0, 612, 792, fill=1, stroke=0)
c.setFillColor(HexColor(green)); c.rect(0, 586, 612, 206, fill=1, stroke=0)

def text(x, y, value, font='Helvetica', size=10, color=ink):
    c.setFillColor(HexColor(color)); c.setFont(font, size); c.drawString(x, y, value)

def para(x, top, width, value, size=10, leading=14, color=ink, font='Helvetica'):
    p = Paragraph(value, ParagraphStyle('guide', fontName=font, fontSize=size,
        leading=leading, textColor=HexColor(color)))
    _, h = p.wrap(width, 1000); p.drawOn(c, x, top-h)
    return top-h

text(42, 752, 'M LAW', 'Helvetica-Bold', 14, '#F5F3EB')
text(355, 754, 'NOVEMBER 12, 2026  /  1:00 PM ET', size=8, color='#CED9D0')
text(42, 702, 'One firm.', 'Times-Roman', 36, '#F5F3EB')
text(42, 662, 'A connected beginning.', 'Times-Italic', 36, '#F5F3EB')
para(43, 631, 485, 'A working demonstration for reception, matters and team coordination. '
     'Today: agree the first pilot, its owner and the evidence for a safe transition.',
     size=10.5, leading=15, color='#D7E0D8')

text(42, 558, 'THE 12-MINUTE WALKTHROUGH', 'Helvetica-Bold', 9)
rows = [
 ('01', 'Meet Maya', 'Choose a language, play her greeting, create a fictional inquiry and reserve a consultation. Local voice mode supports interruption.'),
 ('02', 'Follow the matter', 'Open the linked intake, owner, tasks and calendar. Show the daily brief and the work that needs attention.'),
 ('03', 'Prepare and review', 'Create a work product and request an internal attorney review tied to that document version.'),
 ('04', 'Plan the transition', 'Try the sample import. Record current subscriptions, export owners and the first workflow to pilot.'),
]
y = 534
for number, title, body in rows:
    text(42, y-12, number, 'Times-Italic', 19, '#8A9D80')
    text(78, y-10, title, 'Helvetica-Bold', 11)
    bottom = para(78, y-19, 485, body, size=9.5, leading=13)
    y = bottom-18

c.setStrokeColor(HexColor('#D4DBCD')); c.line(42, y+5, 570, y+5)
y -= 14
text(42, y, 'DECISIONS TO RECORD WITH ADNAN', 'Helvetica-Bold', 9)
decisions = [
 'Pilot workflow and responsible attorney',
 'Staff roles, current systems and export owners',
 'Hosting, maintenance and human escalation owner',
 'Language acceptance and parallel-run review date',
]
y -= 22
for value in decisions:
    c.setStrokeColor(HexColor('#84947E')); c.rect(43, y-1, 7, 7, fill=0, stroke=1)
    text(60, y, value, size=9.5); y -= 19

c.setFillColor(HexColor('#E8EBDD')); c.roundRect(42, 109, 528, 65, 6, fill=1, stroke=0)
text(55, 155, 'OPEN THE MEETING', 'Helvetica-Bold', 8)
para(55, 144, 498, '<b>This computer:</b> double-click Start Meeting.cmd in the project folder. '
     'Keep its window open. <b>Online:</b> use the private preview on the owner\'s signed-in device. '
     'The online preview stores fictional records in that browser.', size=9, leading=12)

para(42, 92, 528, '<b>Demonstration and pilot planning.</b> Live phone forwarding is a later step. '
     'Production security, legal rules, filing, trust accounting and real-call operation still need implementation or validation. '
     'Firm-owned software reduces subscription dependence; hosting, phone usage and maintenance remain operating costs.',
     size=8, leading=11, color=muted)
c.save()
reader = PdfReader(str(OUT))
assert len(reader.pages) == 1
assert 'DECISIONS TO RECORD WITH ADNAN' in reader.pages[0].extract_text()
print(OUT)
