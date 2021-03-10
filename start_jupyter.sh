#!/bin/bash
export DISPLAY=:0
Xvfb :0 & jupyterhub-singleuser "$@"
