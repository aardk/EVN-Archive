import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { ExpListInterface } from './EVN-Archive';
import { SearchInterface } from './EVN-Archive';
import { requestAPI } from './EVN-Archive';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import {FormikSelect, Option} from './FormikSelect';
import { OptionsType } from "react-select";

import MaterialTable from 'material-table';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';

const EVNComponent = (
  props: {
      exp_list: Option[];
      src_list: Option[]
      bands: Option[];
      jupyter: JupyterFrontEnd;
    }): JSX.Element => {
    const [results, setResults] = useState([])

    return (
  <div>
  <Formik
    initialValues = {{ obs_id: '',
                       target_name: [],
                       band: [] }}
    validationSchema = {Yup.object({
      obs_id: Yup.string(),
      target_name: Yup.array().of( 
              Yup.string()),
      band: Yup.array().of( 
              Yup.string()
              )
    })}
    onSubmit = {(values, { setSubmitting }) => {
             console.log('values =', values);
             requestAPI<any>('search', {}, values)
        .then(search_result => {
          console.log(search_result);
          setResults(search_result);
        })
             setSubmitting(false);
         }}
  >
  <Form>
    <Grid container>
      <Grid item xs>
        <label htmlFor="obs_id">Experiment</label>
        <Field
          className = 'FormikSelect'
          name = 'obs_id'
          component = {FormikSelect}
          placeholder = "Experiment code"
          options = { props.exp_list }
          isMulti = {false}
        />
        <ErrorMessage name="obs_id" />
      </Grid>
      <Grid item xs>
        <label htmlFor="taget_name">Source</label>
        <Field
          className = 'FormikSelect'
          name = 'target_name'
          component = {FormikSelect}
          placeholder = "Source name"
          options = { props.src_list }
          isMulti = {true}
        />
      <ErrorMessage name="target_name" />
      </Grid>
      <Grid item xs>
        <label htmlFor="band">Observing Band</label>
        <Field
          className = 'FormikSelect'
          name = 'band'
          placeholder = "Band L, C, X, etc."
          options = { props.bands }
          component = {FormikSelect}
          isMulti = {true}
        />
      <ErrorMessage name="band" />
      </Grid>

      <Grid item xs={12}>
        <button type = "submit"> SEARCH </button>
        <ErrorMessage name="submit" />
      </Grid>
    </Grid>
  </Form>
  </Formik>
  <br />
  <Divider />
  <br />
  <Formik
    initialValues = {{ s_ra: '',
                       s_dec: '',
                       radius: 0}}
    validationSchema = {Yup.object({
      s_ra: Yup.string().matches(/^(([01]?[0-9]|[2][0-3]):([0-5]?[0-9]):([0-5]?[0-9]|[0-5]?[0-9].[0-9]*)|([01]?[0-9]|[2][0-3])h([0-5]?[0-9])m([0-5]?[0-9]|[0-5]?[0-9].[0-9]*s))$/, 'Format: 00:00:00.0 or 00h00m:00.0s'),
      s_dec: Yup.string().matches(/^((-?[0-8]?[0-9])d([0-5]?[0-9])'([0-5]?[0-9]|[0-5]?[0-9].[0-9]*)"|(-?[0-8]?[0-9]):([0-5]?[0-9]):([0-5]?[0-9]|[0-5]?[0-9].[0-9]*))$/, 'Format: 00:00:00.0 or 00d00\'00.0\"'),
      radius: Yup.number().positive()
    })}
    onSubmit = {(values, { setSubmitting }) => {
             console.log('values =', values);
             requestAPI<any>('search', {}, values)
                .then(search_result => {
                    console.log(search_result);
                    setResults(search_result);
             });
             setSubmitting(false);
         }}
  >
  <Form>
    <Grid container>
      <Grid item xs={3}>
        <label htmlFor="s_ra">Right Ascension     </label>
        <Field
        name="s_ra"
        type="text"
        />
      <ErrorMessage name="s_ra" />
      </Grid>
      <Grid item xs={3}>
        <label htmlFor="s_dec">Declination        </label>
        <Field
          name="s_dec"
          type="text"
        />
      <ErrorMessage name="s_dec" />
      </Grid>
      <Grid item xs={3}>
        <label htmlFor="radius">Radius [arcseconds]</label>
          <Field
            name="radius"
            type="number"
           />
      <ErrorMessage name="radius" />
      </Grid>
      <Grid item xs={12}>
        <button type = "submit"> SEARCH </button>
        <ErrorMessage name="submit" />
      </Grid>
    </Grid>
  </Form>
  </Formik>
  <br />
  <br />
  <Grid container>
    <Grid item xs={12}>
    <MaterialTable
          actions={[{
            icon: 'save_alt',
            tooltip: 'Open notebook',
            onClick: (event, rowData) => {
            console.log('Find nb for:', rowData.obs_id); 
            requestAPI<any>('get_notebook_list', {}, {obs_id: rowData.obs_id})
                .then(search_result => {
                    console.log('notebooks:', search_result);
                    requestAPI<any>('get_exp', {}, {obs_id: rowData.obs_id, notebook: search_result[0].notebook})
                    .then(nb_results => {
                        console.log('nb_results:', nb_results);
                        const { commands } = props.jupyter;
                        commands.execute('docmanager:open', {
                                          path: nb_results.notebook
                                        });
                    });
                });
              } 
            }
          ]}
          columns={[
            { title: 'Experiment', field: 'obs_id' },
            { title: 'Source', field: 'target_name' },
            { title: 'Ra', field: 's_ra'},
            { title: 'Dec', field: 's_dec'},
            { title: 'Exp. time', field: 't_exptime'},
            { title: 'Distance', field: 'dist'} ]}
          data={results}
          title="Search results"
        /> 
      </Grid>
    </Grid>
   </div>
  );
};

export class EVNWidget extends ReactWidget {
  /**
   * Constructs a new EVNWidget.
   */
  private exp_list : Option[];
  private src_list : Option[];
  private bands : Option[];
  protected theAPP : JupyterFrontEnd;

  constructor(allObs: ExpListInterface, app: JupyterFrontEnd) {
    super();

    // All experiment codes in EVN Archive
    let exp_list: Option[] = []
    for (var exp of allObs.exp) {
      let entry = { 'value': exp, 'label': exp };
      exp_list.push(entry);
    }
    this.exp_list = exp_list;

    // All sources in EVN Archive
    let src_list: Option[] = []
    for (var src of allObs.src) {
      let entry = { 'value': src, 'label': src };
      src_list.push(entry);
    }
    this.src_list = src_list;
    this.addClass('jp-ReactWidget');
    this.theAPP = app;
    this.bands  = [ { value: 'any', label: 'Any band'},
                    { value: 'P', label: 'P band' },
            { value: 'L', label: 'L band' },
            { value: 'S', label: 'S band' },
            { value: 'C', label: 'C band' },
            { value: 'X', label: 'X band' },
            { value: 'K', label: 'K band' },
                    { value: 'Q', label: 'Q band' }]
  }

  protected render(): React.ReactElement<any> {
    return (
      <EVNComponent 
      exp_list = {this.exp_list}
      src_list = {this.src_list}
      bands = {this.bands}
      jupyter = {this.theAPP}
    />
    )
  }
}
