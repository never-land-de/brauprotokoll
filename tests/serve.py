"""Development server reproducing the GitHub Pages project subpath."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self,path):
        path=unquote(urlsplit(path).path)
        if path=='/': return str(ROOT/'index.html')
        if path.startswith('/brauprotokoll/'): path=path[len('/brauprotokoll/'):]
        else: path=path.lstrip('/')
        target=(ROOT/path).resolve()
        return str(target if target.is_relative_to(ROOT) else ROOT/'404')
    def log_message(self,format,*args):
        if args and str(args[1] if len(args)>1 else '') not in ('200','304'): super().log_message(format,*args)
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        super().end_headers()
if __name__=='__main__': ThreadingHTTPServer(('127.0.0.1',4173),Handler).serve_forever()
