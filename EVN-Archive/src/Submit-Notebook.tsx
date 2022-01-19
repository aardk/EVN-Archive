import React from 'react'
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ToolbarButtonComponent } from '@jupyterlab/apputils'; 
import { LabIcon } from '@jupyterlab/ui-components';
import {
  NotebookActions,
  NotebookPanel,
  INotebookModel,
} from '@jupyterlab/notebook';

export function NotebookSubmitComponent(
  props: ToolbarButtonComponent.IProps
): JSX.Element {
  // In some browsers, a button click event moves the focus from the main
  // content to the button (see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus).
  // We avoid a click event by calling preventDefault in mousedown, and
  // we bind the button action to `mousedown`.
  const handleMouseDown = (event: React.MouseEvent) => {
    // Fire action only when left button is pressed.
    if (event.button === 0) {
      event.preventDefault();
      props.onClick?.();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    if (key === 'Enter' || key === ' ') {
      props.onClick?.();
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (event.button === 0) {
      props.onClick?.();
    }
  };

  const getTooltip = () => {
    if (props.enabled === false && props.disabledTooltip) {
      return props.disabledTooltip;
    } else if (props.pressed && props.pressedTooltip) {
      return props.pressedTooltip;
    } else {
      return props.tooltip || props.iconLabel;
    }
  };

  return (
    <button
      className={
        props.className
          ? props.className + ' jp-ToolbarButtonComponent'
          : 'jp-ToolbarButtonComponent'
      }
      aria-pressed={props.pressed}
      aria-disabled={props.enabled === false}
      disabled={props.enabled === false}
      onClick={props.actualOnClick ?? false ? handleClick : undefined}
      onMouseDown={
        !(props.actualOnClick ?? false) ? handleMouseDown : undefined
      }
      onKeyDown={handleKeyDown}
      title={getTooltip()}
      //minimal
    >
      {(props.icon || props.iconClass) && (
        <LabIcon.resolveReact
          icon={props.pressed ? props.pressedIcon : props.icon}
          /*iconClass={
            // add some extra classes for proper support of icons-as-css-background
            classes(props.iconClass, 'jp-Icon')
          }*/
          className="jp-ToolbarButtonComponent-icon"
          tag="span"
          stylesheet="toolbarButton"
        />
      )}
      {props.label && (
        <span className="jp-ToolbarButtonComponent-label">{props.label}</span>
      )}
    </button>
  );
}

/**
 * Note that ToolbarButton extends ReactWidget
 */
export class SubmitNotebookWidget extends ToolbarButton {
  /**
   * Creates a toolbar button
   * @param props props for underlying `ToolbarButton` component
   */
  //constructor(private props: ToolbarButtonComponent.IProps = {}) {
  constructor(props: ToolbarButtonComponent.IProps = {}) {
    super(props);
    this._props = props
  }

  render(): JSX.Element {
    return (
      <NotebookSubmitComponent
       {...this._props}
        pressed={this.pressed}
        enabled={this.enabled}
        onClick={this.onClick}
      />
    );
  }
  private _props: ToolbarButtonComponent.IProps;
}


export class SubmitNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
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
    const submitNotebook = () => {
      NotebookActions.clearAllOutputs(panel.content);
    };
    //const button = new SubmitNotebookWidget({
    const button = new ToolbarButton({
      className: 'submit-notebook-button',
      label: 'Submit notebook',
      onClick: submitNotebook,
      tooltip: 'Submit current notebook to the EVN archive'
    });
    panel.toolbar.insertItem(10, 'submitNotebook', button);
    console.log('file =' + context.localPath);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
