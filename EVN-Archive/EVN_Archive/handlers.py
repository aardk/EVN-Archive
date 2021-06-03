import json
import os

from notebook.base.handlers import APIHandler
from notebook.utils import url_path_join
from urllib.request import urlretrieve
from urllib.parse import urlparse
import pathlib
import numpy import np

import tornado
import re
import pyvo

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
        service = pyvo.dal.TAPService('http://evn-vo.jive.eu/tap') 
        # Translate standard wildcards to SQL
        transtable = str.maketrans({'*': '%', '?': '_', '!': '^'})
        query = "SELECT target_name, obs_id, t_exptime, s_ra, s_dec"
        query_terms = []
        if q['obs_id'] != "":
            exp = q['obs_id'].translate(transtable)
            query_terms.append(f"obs_id LIKE '{exp}'")
        if q['target_name'] != "":
            src = q['target_name'].translate(transtable)
            query_terms.append(f"target_name LIKE '{src}'")
        if q['radius'] != "":
            query += f", DISTANCE(POINT('ICRS', {q['s_ra']}, {q['s_dec']}), POINT('ICRS', s_ra, s_dec)) AS dist"
            query_terms.append(f"1=CONTAINS(POINT('ICRS', {q['s_ra']}, {q['s_dec']}), CIRCLE('ICRS', s_ra, s_dec, {q['radius']})) ORDER BY dist ASC")
        query += " FROM ivoa.obscore"
        for i, term in enumerate(query_terms):
            if i == 0:
                query += f" WHERE {term}"
            else:
                query += f" AND {term}"

        result = service.search(query)
        response = []
        for rec in result:
            row = {}
            for key in rec:
                val = rec[key]
                # In some versions of pyvo queries yield strings whereas 
                # in others it is byte arrays
                if type(val) == bytes:
                    row[key] = val.decode()
                elif type(val) == np.float32:
                    row[key] = float(val)
                elif type(val) == np.int32:
                    row[key] = int(val)
                else:
                    row[key] = val
            response.append(row)
        self.finish(json.dumps(response))
            
class GetExpHandler(APIHandler):
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
        ### TEST Code ; fetch experiment
        EXP = 'N11L3'
        path = os.path.join(os.path.expanduser('~'), 'work', EXP)
        os.makedirs(path, mode=0o775, exist_ok=True)
        result = service.search(f"SELECT * FROM ivoa.obscore WHERE obs_id = '{EXP}'")
        dataobj = result[0].getdataobj()
        #urls = [f.decode() for f in dataobj.getcolumn('access_url').data]
        urls = [f for f in dataobj.getcolumn('access_url').data]
        for url in urls:
            filename = pathlib.Path(urlparse(url).path).name 
            f = os.path.join(path, filename)
            try:
                urlretrieve(url, f)
            except HTTPError:
                logging.error(f"Error: Unable to fetch url : '{url}'")
            os.chmod(f, 0o664)

        ## End of test code

def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    route_pattern = url_path_join(base_url, "EVN-Archive", "get_exp_list")
    handlers = [(route_pattern, ExpListHandler)]

    route_pattern = url_path_join(base_url, "EVN-Archive", "search")
    handlers.append((route_pattern, SearchHandler))

    route_pattern = url_path_join(base_url, "EVN-Archive", "get_exp")
    handlers.append((route_pattern, GetExpHandler))

    web_app.add_handlers(host_pattern, handlers)
