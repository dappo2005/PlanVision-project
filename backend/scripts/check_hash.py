import os, bcrypt
h = os.environ.get('HASH','').encode()
p = os.environ.get('PASS','').encode()
print('hash_len', len(h))
try:
    print('check', bcrypt.checkpw(p, h))
except Exception as e:
    print('error', type(e).__name__, str(e))

