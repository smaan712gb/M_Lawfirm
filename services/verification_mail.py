"""Private verification delivery through the firm's existing SMTP server.

Python standard library only. Never run publicly. No message is sent at startup.
"""
import hmac,json,os,re,smtplib,ssl
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer

def deliver(payload):
 destination=payload.get('destination','');code=payload.get('code','')
 if not isinstance(destination,str) or not re.fullmatch(r'[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+',destination): raise ValueError('A registered email address is required')
 if not isinstance(code,str) or not re.fullmatch(r'\d{6}',code): raise ValueError('Invalid code')
 sender=os.environ['SMTP_FROM']
 message=EmailMessage();message['From']=sender;message['To']=destination;message['Subject']='M Law: your requested verification code'
 message.set_content(f'Your requested verification code is {code}. It expires in five minutes.\n\nIf you did not request this, disregard the message. No case information is included.\nM Law reception')
 context=ssl.create_default_context()
 with smtplib.SMTP(os.environ['SMTP_HOST'],int(os.getenv('SMTP_PORT','587')),timeout=15) as smtp:
  smtp.ehlo();smtp.starttls(context=context);smtp.ehlo()
  if os.getenv('SMTP_USERNAME'): smtp.login(os.environ['SMTP_USERNAME'],os.environ['SMTP_PASSWORD'])
  smtp.send_message(message)

class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass  # no destination, code or authorization logging
 def do_POST(self):
  expected='Bearer '+os.environ['VERIFICATION_DELIVERY_TOKEN']
  if not hmac.compare_digest(self.headers.get('Authorization',''),expected): self.send_error(401);return
  length=int(self.headers.get('Content-Length','0'))
  if not 0<length<=5000:self.send_error(413);return
  try:
   deliver(json.loads(self.rfile.read(length)));self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"accepted":true}')
  except ValueError:self.send_error(422,'Registered email delivery unavailable')
  except Exception:self.send_error(502,'Mail delivery unavailable')

if __name__=='__main__':
 if len(os.getenv('VERIFICATION_DELIVERY_TOKEN',''))<24:raise SystemExit('Set a private verification token of at least 24 characters.')
 ThreadingHTTPServer(('127.0.0.1',int(os.getenv('VERIFICATION_PORT','8766'))),Handler).serve_forever()
