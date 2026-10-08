FROM penngwyn/jupytercasa:casa-6.7
CMD ["xvfb-run", "jupyter", "lab"]

USER root

#RUN pip config --user set global.progress_bar off
RUN pip install --break-system-packages GitPython~=3.1.50 jupyterlab-git~=0.53.0
COPY EVN-Archive /usr/local/EVN-Archive
RUN cd /usr/local/EVN-Archive \
    && pip install --break-system-packages . \
    && rm -rf .yarn/cache node_modules
RUN apt-get update && apt-get install -y sudo && rm -rf /var/lib/apt/lists/*

RUN pip install --break-system-packages requests_oauthlib
RUN echo "jupyter ALL = (ALL) NOPASSWD:SETENV: /usr/bin/token_service.py" >/etc/sudoers.d/jupyter-user \
    && chmod 0440 /etc/sudoers.d/jupyter-user
COPY start_jupyter.sh token_service.py /usr/bin/

USER jupyter
ENV SHELL=/bin/bash
COPY --chown=jupyter:jupyter gitconfig /home/jupyter/.gitconfig
