import React from 'react'
import Modal from '@material-ui/core/Modal';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';

import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ReactWidget } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookActions, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { Formik, Form, Field, ErrorMessage } from 'formik';
//import Select from 'react-select';
import { FormikSelect, Option } from './FormikSelect';
import { requestAPI, ExpListInterface } from './EVN-Archive';
import * as Yup from 'yup';

export interface SubmitWidgetInterface { 
  local_path: string;
  exp_list?: Option[];
  className?: string; 
  label?: string; 
  tooltip?: string; 
}

export function NotebookSubmitComponent(
  props: SubmitWidgetInterface
): JSX.Element {

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
   <div>
    <Button
      onClick = { handleOpen }
    >
      {props.label && (
        <span className = "jp-ToolbarButtonComponent-label">{props.label}</span>
      )}
    </Button>
    <Modal
      open = {open}
      onClose = {handleClose}
      aria-labelledby = "modal-modal-title"
      aria-describedby = "modal-modal-description"
    >
      <Box sx = {style}>
      <Formik
	initialValues = {{ obs_id: '',
                           local_path: props.local_path,
			   description: '' }}
	validationSchema = {Yup.object({
	  obs_id: Yup.string(),
	  description: Yup.string() })}
	onSubmit = {(values, { setSubmitting }) => {
		 console.log('values =', values);
		 console.log('obs_id =', values.obs_id);
                 requestAPI<any>('submit', {}, {obs_id: values.obs_id, 
                                                local_path: values.local_path,
                                                description: "Dummy_de_mummy"})
//                                                description: values.description})
                 .then(response => {
                    console.log('Submit response:', response);
		 })
                 .catch((error) => {
                   console.error('Error:', error);
                 });
  		 setSubmitting(false);
                 setOpen(false);
	}}
      >
      <Form>
	<Grid container>
          <Grid item xs>
	    <label htmlFor="obs_id">Experiment</label>
	    <Field
	      className = 'FormikSelect'
	      name = 'obs_id'
	      component = { FormikSelect }
	      placeholder = "Experiment code"
	      options = { props.exp_list }
              isCreatable = { false }
	      isMulti = { false }
	    />
	    <ErrorMessage name="obs_id" />
          </Grid>
          <Grid item xs={12}>
	    <label htmlFor="description">Notebook description</label>
	    <Field
	      className = 'TextareaAutosize'
	      name = 'description'
	      component = { TextareaAutosize }
	      placeholder = "Notebook description"
              minRows = {5}
              style = {{ width: 400 }}
            />
	  <ErrorMessage name="description" />
          </Grid>
	</Grid>
	<Grid item xs={12}>
	  <button type = "submit"> SUBMIT </button>
	  <ErrorMessage name="submit" />
	</Grid>
      </Form>
      </Formik>
      </Box>
    </Modal>
   </div>
  );
}

export class SubmitNotebookWidget extends ReactWidget {
  private _props: SubmitWidgetInterface;

  constructor(props: SubmitWidgetInterface) {
    super();
    this._props = props
  }

  render(): JSX.Element {
    return (
      <NotebookSubmitComponent
       {...this._props}
        //pressed = {this.pressed}
        //enabled = {this.enabled}
        //onClick = {this.onClick}
      />
    );
  }
}


export class SubmitNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  private exp_list : Option[];

  constructor(allObs: ExpListInterface) {
    let exp_list: Option[] = []
    for (var exp of allObs.exp) {
      let entry = { 'value': exp, 'label': exp };
      exp_list.push(entry);
    }
    this.exp_list = exp_list;
  }

  /**
   * Create a new extension for the notebook panel widget.
   *
   * @param panel Notebook panel
   * @param context Notebook context
   * @returns Disposable on the added button
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    console.log("Start createnew")

    const button = new SubmitNotebookWidget({
      className: 'submit-notebook-button',
      label: 'Submit notebook',
      tooltip: 'Submit current notebook to the EVN archive',
      exp_list: this.exp_list,
      local_path: context.localPath
    });
    panel.toolbar.insertItem(10, 'submitNotebook', button);
    console.log('file =' + context.localPath);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
