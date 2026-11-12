"""Fetch the official voice-design model and record its resolved revision."""
import json,argparse
from pathlib import Path
from huggingface_hub import snapshot_download
parser=argparse.ArgumentParser();parser.add_argument('--base',action='store_true');args=parser.parse_args()
root=Path(__file__).resolve().parents[1]/'.conversation-cache'/('qwen-base' if args.base else 'qwen-design')
repo='Qwen/Qwen3-TTS-12Hz-1.7B-'+('Base' if args.base else 'VoiceDesign')
revision='fd4b254389122332181a7c3db7f27e918eec64e3' if args.base else '5ecdb67327fd37bb2e042aab12ff7391903235d3'
snapshot_download(repo,revision=revision,local_dir=root)
(root/'provenance.json').write_text(json.dumps({'repository':repo,'revision':revision},indent=2))
print('Downloaded official voice-design model '+revision,flush=True)
