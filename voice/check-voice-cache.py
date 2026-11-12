"""Check exact voice identity/language lookup and fail-closed fallback behavior."""
import json
from pathlib import Path
from fastapi import HTTPException
import service
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'dist/maya-media.json').read_text(encoding='utf-8'))
service.engine='fixed'
for clip in manifest['clips']:
 expected=(root/'dist'/clip['audio'].lstrip('/')).read_bytes()
 assert service.synthesize(clip['text'],clip['language'])==expected
for language,text in [('ur','Hello, this is an English greeting.'),('en','A new unrecorded private update.'),('pa','ਸਤ ਸ੍ਰੀ ਅਕਾਲ')]:
 try:service.synthesize(text,language)
 except HTTPException as error:assert error.status_code==422
 else:raise AssertionError('Unexpected speech fallback')
assert service.health()['languages']==[]
assert set(service.health()['fixed_phrase_languages'])=={'en','es','ur','hi','ar'}
assert len(manifest['clips'])==80
print('All 80 cached voices match exactly; unrecorded responses never fall back to another speaker or language.')
