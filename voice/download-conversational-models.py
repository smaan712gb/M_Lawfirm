"""Pin the official public multilingual weights for local voice evaluation."""
from pathlib import Path
from huggingface_hub import snapshot_download
import json
root=Path(__file__).resolve().parents[1]
repo='ResembleAI/chatterbox';revision='5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18'
destination=root/'.conversation-cache/multilingual'
files=['ve.pt','t3_mtl23ls_v3.safetensors','s3gen.pt','grapheme_mtl_merged_expanded_v1.json','conds.pt','Cangjie5_TC.json']
snapshot_download(repo,revision=revision,local_dir=destination,allow_patterns=files)
(destination/'provenance.json').write_text(json.dumps({'repository':repo,'revision':revision,'files':files},indent=2),encoding='utf-8')
print('Conversational model weights downloaded.',flush=True)
