import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {copy} from '../dist/maya-core.mjs';
import {mayaExpression} from '../dist/maya-presence.mjs';
const root=new URL('../',import.meta.url),clips=[];
const provenance=JSON.parse(await readFile(new URL('evidence/maya-speech-assets.json',root),'utf8'));
const videos=JSON.parse(await readFile(new URL('evidence/maya-video-assets.json',root),'utf8'));
const motionRevision=createHash('sha256').update(await readFile(new URL('voice/portrait-motion.py',root))).digest('hex');
for(const [language,phrases] of Object.entries(copy))for(const [key,text] of Object.entries(phrases)){
 const audio=`assets/maya-${language}-${key}.wav`,video=`assets/maya-${language}-${key}.mp4`;
 try{await access(new URL('dist/'+audio,root))}catch{continue}
 let hasVideo=false;try{await access(new URL('dist/'+video,root));hasVideo=true}catch{}
 const hash=createHash('sha256').update(await readFile(new URL('dist/'+audio,root))).digest('hex');
 const recorded=provenance.find(item=>item.language===language&&item.key===key);
 if(!recorded||recorded.text!==text||recorded.sha256!==hash)throw Error(`Speech is stale or unverified: ${language}/${key}. Regenerate it before indexing.`);
 let videoHash='';
 if(hasVideo){
  const videoRecord=videos[video.split('/').pop()];videoHash=createHash('sha256').update(await readFile(new URL('dist/'+video,root))).digest('hex');
  if(videoRecord?.audio_sha256!==hash||videoRecord?.video_sha256!==videoHash)throw Error(`Video does not match the current speech: ${language}/${key}. Regenerate lip-sync.`);
  if(videoRecord.motion_revision!==motionRevision||!videoRecord.refined_sha256)throw Error(`Video uses an older motion pipeline: ${language}/${key}. Regenerate the portrait.`);
 }
 const revision=createHash('sha256').update(hash+videoHash).digest('hex').slice(0,16);
 clips.push({language,key,text,revision,expression:mayaExpression(key),audio:'/'+audio,...(hasVideo?{video:'/'+video}:{})});
}
await writeFile(new URL('dist/maya-media.json',root),JSON.stringify({version:1,clips},null,2)+'\n');
console.log(`Indexed ${clips.length} language-specific recordings, ${clips.filter(c=>c.video).length} synchronized videos.`);
