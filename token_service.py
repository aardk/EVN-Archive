#!/usr/bin/env python3
import os
import socket
import struct
import json
from requests_oauthlib import OAuth2Session

SOCK_PATH = '/tmp/jupyter-auth'
AUTH_REFRESH_TOKEN = os.environ['AUTH_REFRESH_TOKEN']
# OAUTHLIB_INSECURE_TRANSPORT is only for testing!
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'   

def get_client():
    with open('/etc/jivehub/client.json', 'r') as f:
        ctrl = json.load(f)
    client = {'client_id': ctrl['client_id'], 'client_secret': ctrl['client_secret']}
    return ctrl['token_url'], client

def get_token(token_url, client):
    kcloak = OAuth2Session(client_id)
    try:
        response = kcloak.refresh_token(token_url, AUTH_REFRESH_TOKEN, **client)
        return response['access_token']
    except:
        return ''
###
########################################### MAIN ##########################
###
if __name__ == "__main__":
    token_url, client = get_client()
    try:
        os.unlink(SOCK_PATH)
    except FileNotFoundError:
        pass
    os.umask(0)
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    sock.bind(SOCK_PATH)
    sock.listen(1)
    while(True):
        conn, addr = sock.accept()
        try:
            # Client sends integer to request a new token
            req = conn.recv(4)
            while len(req) == 4:
                token = get_token(token_url, client)
                # NB: if we fail to get token we get the empty string
                if len(token) > 0:
                    conn.sendall(struct.pack('i', len(token)))
                    conn.sendall(token.encode())
                else:
                    conn.sendall(struct.pack('i', -1))
                req = conn.recv(4)
        finally:
            conn.close()
