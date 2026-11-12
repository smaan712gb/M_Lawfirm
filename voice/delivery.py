"""Maya's requested softer, slower delivery, preserving vocal pitch."""
import argparse,subprocess
from pathlib import Path
import imageio_ffmpeg
PROFILE={'tempo':.9,'gain':.92,'softening_hz':3200,'softening_db':-1.2,'version':1}
def polish(source,target):
 subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-loglevel','error','-i',str(source),'-af','equalizer=f=3200:t=q:w=0.8:g=-1.2,atempo=0.90,volume=0.92','-ac','1','-c:a','pcm_s16le',str(target)],check=True,timeout=60)
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('source');parser.add_argument('target');args=parser.parse_args();polish(args.source,args.target)
