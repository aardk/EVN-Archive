import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { ExpListInterface } from './EVN-Archive';
import { SearchInterface } from './EVN-Archive';
import { requestAPI } from './EVN-Archive';

import React, {useState} from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

import {FormikSelect, Option} from './FormikSelect';
import { OptionsType } from "react-select";

import MaterialTable from 'material-table';

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

  send_request(req : SearchInterface) : void {
    requestAPI<any>('search', {}, req)
      .then(search_result => {
        console.log(search_result);
    })
  }

  protected render(): React.ReactElement<any> {
    const outerdiv = { width: '610px' }
    const innersmalldiv = { width: '200px', display: 'inline-block'}
    const innerbigdiv = { width: '300px', display: 'inline-block'}

    return (
//      <div style = {{ max-width: '300px', display: 'flex', flex-wrap: 'wrap' }}>
  <div style = { outerdiv }>
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
             this.send_request(values);
             setSubmitting(false);
         }}
  >
  <Form>
      <div style = { innersmalldiv}>
        <label htmlFor="obs_id">Experiment</label>
        <Field
          className = 'FormikSelect'
          name = 'obs_id'
          component = {FormikSelect}
          placeholder = "Experiment code"
          options = { this.exp_list }
          isMulti = {false}
        />
        <ErrorMessage name="obs_id" />
      </div>
      <div style = { innersmalldiv }>
        <label htmlFor="taget_name">Source</label>
        <Field
          className = 'FormikSelect'
          name = 'target_name'
          component = {FormikSelect}
          placeholder = "Source name"
          options = { this.src_list }
          isMulti = {true}
        />
      <ErrorMessage name="target_name" />
      </div>
      <div style = { innersmalldiv }>
        <label htmlFor="band">Observing Band</label>
        <Field
          className = 'FormikSelect'
          name = 'band'
          placeholder = "Band L, C, X, etc."
          options = { this.bands }
          component = {FormikSelect}
          isMulti = {true}
        />
      <ErrorMessage name="band" />
      </div>

      <div style = { innerbigdiv } >
        <button type = "submit"> SEARCH </button>
        <ErrorMessage name="submit" />
      </div>
  </Form>
  </Formik>
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
             this.send_request(values);
             setSubmitting(false);
         }}
  >
  <Form>
      <div style = { innersmalldiv }>
        <label htmlFor="s_ra">Right Ascension</label>
        <Field
        name="s_ra"
        type="text"
        />
      <ErrorMessage name="s_ra" />
      </div>
      <div style = { innersmalldiv }>
        <label htmlFor="s_dec">Declination</label>
        <Field
          name="s_dec"
          type="text"
        />
      <ErrorMessage name="s_dec" />
      </div>
      <div style = { innersmalldiv }>
        <label htmlFor="radius">Radius [arcseconds]</label>
          <Field
            name="radius"
            type="number"
           />
      <ErrorMessage name="radius" />
      </div>
      <div style = { innersmalldiv } >
        <button type = "submit"> SEARCH </button>
        <ErrorMessage name="submit" />
      </div>
  </Form>
  </Formik>
    <MaterialTable
          columns={[
            { title: 'Adı', field: 'name' },
            { title: 'Soyadı', field: 'surname' },
            { title: 'Doğum Yılı', field: 'birthYear', type: 'numeric' },
            { title: 'Doğum Yeri', field: 'birthCity', lookup: { 34: 'İstanbul', 63: 'Şanlıurfa' } }
          ]}
          data={[{ name: 'Mehmet', surname: 'Baran', birthYear: 1987, birthCity: 63 }]}
          title="Demo Title"
        /> 
   </div>
    )
  }
}
