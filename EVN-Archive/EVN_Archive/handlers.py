import json
import os

from notebook.base.handlers import APIHandler
from notebook.utils import url_path_join
from urllib.request import urlretrieve
import pathlib
import numpy as np

import tornado
import re
import pyvo
import requests
from git import Repo, InvalidGitRepositoryError

import logging
logger = logging.getLogger()
logger.setLevel(logging.WARNING)

class ExpListHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post, 
    # patch, put, delete, options) to ensure only authorized user can request the 
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        # Get list of available experiments and sources from VO and send results to client.
        service = pyvo.dal.TAPService('http://evn-vo.jive.eu/tap')
        results = service.search("SELECT target_name, obs_id FROM ivoa.obscore")
        #expList = sorted([x.decode() for x in set(results.getcolumn('obs_id'))])
        #srcList = sorted([x.decode() for x in set(results.getcolumn('target_name'))])
        expList = sorted([x for x in set(results.getcolumn('obs_id'))])
        srcList = sorted([x for x in set(results.getcolumn('target_name'))])
        response = {'exp': expList, 'src': srcList}
        self.finish(json.dumps(response))

    def get_old(self):
        import urllib
        # Get list of experiments from archive and send to client. This is 
        # just a prototype, eventually we'll get this information from the VO.
        with urllib.request.urlopen('http://archive.jive.nl/exp/') as response:
            lines = response.read().decode('utf-8').split('\n')
        dirs = [i for i in lines if 'alt="[DIR]"' in i]
        r = re.compile(r'href=\"(\w+)_')
        exp = {'exp' : [r.findall(i)[0] for i in dirs]}
        self.finish(json.dumps(exp))


class SearchHandler(APIHandler):
    def ra_to_deg(self, ra):
        h,m,sec = [float(x) for x in re.split(':|h|m|s', ra)[:3]]
        return (h + m / 60 + sec / 3600) * 360 / 24

    def dec_to_deg(self, dec):
        d,m,sec = [float(x) for x in re.split(':|d|\'|\"', dec)[:3]]
        return d + m / 60 + sec / 3600

    def deg_to_ra(self, deg):
        while deg < 0:
            deg += 360
        ra = deg / 15
        hours = int(ra)
        m = (ra - hours) * 60
        minutes = int(m)
        seconds = 60 * (m - minutes)
        return f"{hours:02d}h{minutes:02d}m{seconds:06.3f}s"

    def deg_to_dec(self, deg):
        degrees = int(deg)
        m = abs(deg - degrees) * 60
        minutes = int(m)
        seconds = 60 * (m - minutes)
        return f"{degrees:02d}d{minutes:02d}'{seconds:06.3f}\""

    # The following decorator should be present on all verb methods (head, get, post, 
    # patch, put, delete, options) to ensure only authorized user can request the 
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        # Get list of available experiments and sources from VO and send results to client.
        q = { 'obs_id': self.get_query_argument('obs_id', default=''),
              'target_name': self.get_query_argument('target_name', default=''),
              's_ra': self.get_query_argument('s_ra', default=''),
              's_dec': self.get_query_argument('s_dec', default=''),
              'radius': self.get_query_argument('radius', default=''),
        }
        logger.warning("obs_id = '{}'".format(self.get_query_argument('obs_id', default=''))) 
        service = pyvo.dal.TAPService('http://evn-vo.jive.eu/tap') 
        # Translate standard wildcards to SQL
        transtable = str.maketrans({'*': '%', '?': '_', '!': '^'})
        query = "SELECT target_name, obs_id, t_exptime, s_ra, s_dec"
        query_terms = []
        if q['obs_id'] != "":
            exp = q['obs_id'].translate(transtable)
            query_terms.append(f"(obs_id LIKE '{exp}')")
        if q['target_name'] != "":
            x = json.loads(q['target_name'].translate(transtable))
            terms = []
            for src in x:
                terms.append(f"(target_name LIKE '{src}')")
            query_terms.append("(" + " OR ".join(terms) + ")")

        if q['radius'] != "":
            s_ra = self.ra_to_deg(q['s_ra'])
            s_dec = self.dec_to_deg(q['s_dec'])
            s_ra = float(q['radius']) / 3600
            query += f", DISTANCE(POINT('ICRS', {s_ra}, {s_dec}), POINT('ICRS', s_ra, s_dec)) AS dist"
            query_terms.append(f"(1=CONTAINS(POINT('ICRS', {s_ra}, {s_dec}), CIRCLE('ICRS', s_ra, s_dec, {s_ra}))) ORDER BY dist ASC")
        query += " FROM ivoa.obscore WHERE " + " AND ".join(query_terms)
        logger.warning(q) 
        logger.warning('query = ' + query) 
        result = service.search(query)
        response = []
        for rec in result:
            row = {}
            for key in rec:
                val = rec[key]
                if (key == 's_ra'):
                    row[key] = self.deg_to_ra(val)
                elif (key == 's_dec'):
                    row[key] = self.deg_to_dec(val)
                elif type(val) == bytes:
                    # In some versions of pyvo queries yield strings whereas 
                    # in others it is byte arrays
                    row[key] = val.decode()
                elif type(val) == np.float32:
                    row[key] = float(val)
                elif type(val) == np.int32:
                    row[key] = int(val)
                else:
                    row[key] = val
            response.append(row)
        self.finish(json.dumps(response))
            
class GetNotebookListHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post, 
    # patch, put, delete, options) to ensure only authorized user can request the 
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        q = { 'obs_id': self.get_query_argument('obs_id', default='')}
        results = []
        logger.warning(f'GetNotebookListHandler: q = {q}')
        if q['obs_id'] != '':
            url = f"http://gitea:3000/api/v1/repos/EVN/{q['obs_id']}/contents"
            response = requests.get(url)
            logger.warning(f'GetNotebookListHandler: url = {url}, response = {response}')
            if response:
                contents = response.json()
                logger.warning(contents);
                for rec in contents:
                    name = rec['name']
                    if name.endswith(".ipynb"):
                        results.append({'notebook': name, 'size': rec['size']})
        self.finish(json.dumps(results))

class GetExpHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post, 
    # patch, put, delete, options) to ensure only authorized user can request the 
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        q = { 'obs_id': self.get_query_argument('obs_id', default=''),
              'notebook': self.get_query_argument('notebook', default='')}
        results = {}
        if (q['obs_id'] != "") and (q['notebook'] != ""):
            path = os.path.join('work', q['obs_id'])
            os.makedirs(path, mode=0o775, exist_ok=True)
            url = f"http://gitea:3000/EVN/{q['obs_id']}/raw/branch/master/{q['notebook']}"
            f = os.path.join(path, q['notebook'])
            # If notebook already exists append _[1-9][0-9]* to filename
            rev = 0
            name, ext = os.path.splitext(f)
            while os.path.exists(f):
                rev += 1
                f = name + f"_{rev}" + ext
            try:
                logging.error(f"fetch '{f}' from '{url}'")
                urlretrieve(url, f)
                os.chmod(f, 0o664)
                # strip leading work/ because that is the JupyterLab root
                results = {'notebook': f[5:]}
            except HTTPError:
                logging.error(f"Error: Unable to fetch url : '{url}'")
        self.finish(json.dumps(results))

def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    route_pattern = url_path_join(base_url, "EVN-Archive", "get_exp_list")
    handlers = [(route_pattern, ExpListHandler)]

    route_pattern = url_path_join(base_url, "EVN-Archive", "search")
    handlers.append((route_pattern, SearchHandler))

    route_pattern = url_path_join(base_url, "EVN-Archive", "get_notebook_list")
    handlers.append((route_pattern, GetNotebookListHandler))

    route_pattern = url_path_join(base_url, "EVN-Archive", "get_exp")
    handlers.append((route_pattern, GetExpHandler))

    web_app.add_handlers(host_pattern, handlers)
