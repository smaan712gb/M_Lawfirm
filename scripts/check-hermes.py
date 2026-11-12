"""Exercise the actual installed Hermes MCP discovery and tool dispatcher.

Run with the isolated Hermes Python. All writes use a temporary fictional DB.
No inference provider, API key or external message is involved.
"""
import json,os,shutil,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
os.environ['HERMES_HOME']=str(root/'.hermes-runtime')
from tools.mcp_tool_discovery import register_mcp_servers
from tools.mcp_tool_lifecycle import shutdown_mcp_servers
from tools.registry import registry
with tempfile.TemporaryDirectory(prefix='mlaw-hermes-') as data:
 try:
  names=register_mcp_servers({'mlaw_reception':{'command':shutil.which('node'),'args':[str(root/'reception-mcp.mjs')],'env':{'DATA_DIR':data}}})
  assert len(names)==3,names
  start=next(n for n in names if n.endswith('start_reception'))
  def invoke(name,args):
   result=registry.dispatch(name,args)
   if isinstance(result,str): result=json.loads(result)
   assert 'error' not in result,result
   value=result.get('result',result)
   return json.loads(value) if isinstance(value,str) else value
  result=invoke(start,{'language':'en'})
  turn=next(n for n in names if n.endswith('reception_turn'))
  sid=result['sessionId']
  for response in [{'action':'callback'},{'text':'Hermes Fictional Test'},{'text':'+1 212 555 0186'},{'text':'Please return my fictional inquiry.'},{'action':'confirm'}]:
   result=invoke(turn,{'session_id':sid,**response})
  assert result['receipt']['id']
  queue=invoke(next(n for n in names if n.endswith('reception_queue')),{})
  assert len(queue['callbacks'])==1
  evidence={'registered':names,'confirmed_callback_created':True,'queue_count':len(queue['callbacks']),'model_inference_tested':False}
  (root/'evidence/hermes-check.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
  print(json.dumps(evidence))
 finally: shutdown_mcp_servers()
