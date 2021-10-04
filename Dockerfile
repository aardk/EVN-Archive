FROM penngwyn/jupytercasa:casa-6.3
CMD ["xvfb-run", "jupyter", "notebook"]

USER root

COPY EVN-Archive /usr/local/EVN-Archive
RUN pip install GitPython
RUN cd /usr/local/EVN-Archive \
    && pip install -e . \
    && jupyter serverextension enable --py EVN_Archive --sys-prefix \
    && jlpm \
    && jlpm build \
    && jupyter labextension install . \
    && jupyter lab build

#COPY fix-xvfb-run.sh /tmp/
#RUN /tmp/fix-xvfb-run.sh
COPY start_jupyter.sh /usr/bin/

USER jupyter
ENV SHELL=/bin/bash
