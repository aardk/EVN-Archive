FROM penngwyn/jupytercasa:casa-6.6
CMD ["xvfb-run", "jupyter", "lab"]

USER root

RUN /usr/local/bin/pip config --user set global.progress_bar off
RUN /usr/local/bin/pip install GitPython
RUN /usr/local/bin/pip install jupyterlab-git
COPY EVN-Archive /usr/local/EVN-Archive
RUN cd /usr/local/EVN-Archive \
    && /usr/local/bin/pip install .\
    && jupyter server extension enable --py EVN_Archive --sys-prefix 
#    && jlpm install \
#    && jlpm \
#    && jlpm build \
#    && jlpm install \
#    && jupyter labextension install . \
#    && jupyter lab build
RUN apt-get update
RUN apt-get install -y sudo

RUN /usr/local/bin/pip install requests_oauthlib
RUN echo "jupyter ALL = (ALL) NOPASSWD:SETENV: /usr/bin/token_service.py" >/etc/sudoers.d/jupyter-user \
    && chmod 0440 /etc/sudoers.d/jupyter-user
COPY start_jupyter.sh token_service.py /usr/bin/

USER jupyter
ENV SHELL=/bin/bash
