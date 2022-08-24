FROM penngwyn/jupytercasa:casa-6.5
CMD ["xvfb-run", "jupyter", "notebook"]

USER root

COPY EVN-Archive /usr/local/EVN-Archive
RUN pip install GitPython
RUN cd /usr/local/EVN-Archive \
    && pip install . \
    && jupyter serverextension enable --py EVN_Archive --sys-prefix \
    && jlpm \
    && jlpm build \
    && jlpm install \
    && jupyter labextension install . \
    && jupyter lab build
RUN apt-get install -y sudo

RUN pip install requests_oauthlib
RUN echo "jupyter ALL = (ALL) NOPASSWD:SETENV: /usr/bin/token_service.py" >/etc/sudoers.d/jupyter-user \
    && chmod 0440 /etc/sudoers.d/jupyter-user
COPY start_jupyter.sh token_service.py /usr/bin/

USER jupyter
ENV SHELL=/bin/bash
