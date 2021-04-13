import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { ExpListInterface } from './EVN-Archive';
import { SearchInterface } from './EVN-Archive';
import { requestAPI } from './EVN-Archive';

import React from 'react';

import Select from 'react-select';

export interface IEXP {
  exp : object;
  src : object;
}

export class EVNWidget extends ReactWidget {
  /**
   * Constructs a new EVNWidget.
   */
  private exp_list:object[];
  private src_list:object[];
  protected theAPP : JupyterFrontEnd;
  protected cwd : string;
  protected _selected : IEXP = {
    exp : null,
    src : null
  };

  constructor(allObs: ExpListInterface, app: JupyterFrontEnd, cwd:string) {
    super();

    // All experiment codes in EVN Archive
    let exp_list: object[] = []
    for (var exp of allObs.exp) {
      let entry = { 'value': exp, 'label': exp };
      exp_list.push(entry);
    }
    this.exp_list = exp_list;

    // All sources in EVN Archive
    let src_list: object[] = []
    for (var src of allObs.src) {
      let entry = { 'value': src, 'label': src };
      src_list.push(entry);
    }
    this.src_list = src_list;
    this.addClass('jp-ReactWidget');
    this.theAPP = app;
    this.cwd = cwd
  }

  send_request() : void {
    let x : SearchInterface = {'exp': 'N11L4'}
    requestAPI<any>('search', {}, x)
      .then(search_result => {
        console.log(search_result);
    })
  }

  protected render(): React.ReactElement<any> {
    return (
//      <div style = {{ max-width: '300px', display: 'flex', flex-wrap: 'wrap' }}>
    <div style = {{ display: 'flex'}}>
      <div style = {{ width: '300px'}}>
      <label> Experiment </label>
      <Select
        name = 'experminent'
        defaultValue = {this._selected.exp}
        onChange = { (exp:object):void => {
          console.log(`Experiment selected:`, exp);
          this._selected.exp = {exp: exp};
          const { commands } = this.theAPP;
          //const model = commands.execute('docmanager:new-untitled', {
          //const model = commands.execute('docmanager:new-untitled', {
          //        path: this.cwd,
          //	  type: 'file',
          //        ext: 'py'
          //	});
          // console.log(model)
          commands.execute('docmanager:open', {
                      path: 'EVN_continuum_pyp.ipynb'
                });

        }}
        options = { this.exp_list }
      />
      </div>
      <div style = {{ width: '300px'}}>
      <label> Source </label>
      <Select
        name = 'band'
        defaultValue = {this._selected.src}
        onChange = { (src:object):void => {
          console.log(`Source selected:`, src);
          this._selected.src = {src: src};
          const { commands } = this.theAPP;
          //const model = commands.execute('docmanager:new-untitled', {
          //const model = commands.execute('docmanager:new-untitled', {
	  //        path: this.cwd,
          //	  type: 'file',
	  //        ext: 'py'
          //	});
          // console.log(model)
          commands.execute('docmanager:open', {
                      path: 'EVN_continuum_pyp.ipynb'
                });

        }}
        options = { this.src_list }
      />
      </div> 
      <button onClick = { this.send_request}> SEARCH </button>
   </div>
    )
  }
}
