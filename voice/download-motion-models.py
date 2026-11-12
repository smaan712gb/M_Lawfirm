"""Download only the official human animation weights; no face-recognition models."""
import json
from pathlib import Path
from huggingface_hub import snapshot_download
root=Path(__file__).resolve().parents[1]
repo='KlingTeam/LivePortrait'
revision='82a4fa6735ca58432b6ce39301b4b9ee066dea47'
target=root/'.avatar-cache/liveportrait'
snapshot_download(repo,revision=revision,local_dir=target,allow_patterns=['liveportrait/base_models/*.pth','liveportrait/retargeting_models/*.pth','LICENSE*'])
(target/'provenance.json').write_text(json.dumps({'repository':repo,'revision':revision},indent=2),encoding='utf-8')
print('Downloaded official human portrait motion weights.',flush=True)
