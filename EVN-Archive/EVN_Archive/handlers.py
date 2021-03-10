import json

from notebook.base.handlers import APIHandler
from notebook.utils import url_path_join
import tornado
import urllib
import re
import pyvo

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post, 
    # patch, put, delete, options) to ensure only authorized user can request the 
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        # Get list of available experiments and sources from VO and send results to client.
        service = pyvo.dal.TAPService('http://evn-vo.jive.eu/tap')
        results = service.search("SELECT target_name, obs_id FROM ivoa.obscore")
        expList = sorted([x.decode() for x in set(results.getcolumn('obs_id'))])
        srcList = sorted([x.decode() for x in set(results.getcolumn('target_name'))])
        response = {'exp': expList, 'src': srcList}
        self.finish(json.dumps(response))

    def get_old(self):
        # Get list of experiments from archive and send to client. This is 
        # just a prototype, eventually we'll get this information from the VO.
        with urllib.request.urlopen('http://archive.jive.nl/exp/') as response:
            lines = response.read().decode('utf-8').split('\n')
        dirs = [i for i in lines if 'alt="[DIR]"' in i]
        r = re.compile(r'href=\"(\w+)_')
        exp = {'exp' : [r.findall(i)[0] for i in dirs]}
        self.finish(json.dumps(exp))

def setup_handlers(web_app):
    host_pattern = ".*$"
    
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "EVN-Archive", "get_exp_list")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
