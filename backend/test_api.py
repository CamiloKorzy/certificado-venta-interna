import urllib.request
import json

req = urllib.request.Request("http://localhost:8000/api/indicadores")
# We need to pass the same token the user uses.
# But we don't have their token.
# Is there a way to bypass auth or get a token?
