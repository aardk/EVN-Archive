#!/bin/bash
export DISPLAY=:0
sudo --preserve-env=AUTH_REFRESH_TOKEN -b /usr/bin/token_service.py
unset AUTH_REFRESH_TOKEN
Xvfb :0 & jupyterhub-singleuser "$@"
