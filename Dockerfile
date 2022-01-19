FROM penngwyn/jupytercasa:casa-6.3
CMD ["xvfb-run", "jupyter", "notebook"]

USER root

RUN pip install GitPython
COPY EVN-Archive /usr/local/EVN-Archive
RUN cd /usr/local/EVN-Archive \
    && pip install -e . \
    && jupyter serverextension enable --py EVN_Archive --sys-prefix \
    && jlpm \
    && jlpm build \
    && jupyter labextension install . \
    && jupyter lab build
RUN apt-get install -y sudo

RUN pip install requests_oauthlib
RUN echo "jupyter ALL = (ALL) NOPASSWD:SETENV: /usr/bin/token_service.py" >/etc/sudoers.d/jupyter-user \
    && chmod 0440 /etc/sudoers.d/jupyter-user
COPY start_jupyter.sh token_service.py /usr/bin/

USER jupyter
ENV SHELL=/bin/bash
