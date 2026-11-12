from pathlib import Path
from service import synthesize
text="Hello, I'm Maya, your AI receptionist at M Law. I'm here to listen and help you take the next step. I can arrange a consultation, pass a message to your legal team, or help you request an approved case update. Take your time. How may I help you today?"
target=Path(__file__).resolve().parents[1]/'dist'/'assets'/'maya-welcome.wav'
target.write_bytes(synthesize(text,'en'))
print(f'Created {target.name}: {target.stat().st_size} bytes')
