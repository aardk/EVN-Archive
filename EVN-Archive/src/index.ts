import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { reactIcon } from '@jupyterlab/ui-components';

import { requestAPI } from './EVN-Archive';

import { EVNWidget} from './EVN-Widget';

namespace CommandIDs {
  export const create = 'create-react-widget';
}

/**
 * Initialization data for the EVN-Archive extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'EVN-Archive',
  requires: [IFileBrowserFactory],
  optional: [ ILauncher ],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    browserFactory: IFileBrowserFactory,
    launcher: ILauncher | null
  ) => {
    console.log('JupyterLab extension EVN-Archive is activated!');
    const { commands } = app

    requestAPI<any>('get_exp_list')
      .then(exp_list => {
        console.log(exp_list);
        const command = CommandIDs.create;
        commands.addCommand(command, {
          caption: 'Create experiment selection widget',
          label: 'EVN Archive',
          icon: args => (args['isPalette'] ? null : reactIcon),
          execute: async args  => {
	    //const cwd:string = args['cwd'] == "" ? browserFactory.defaultBrowser.model.path : args['cwd']
	    const cwd:string = browserFactory.defaultBrowser.model.path 
	    console.log(args)
            const content = new EVNWidget(exp_list, app, cwd);
            const widget = new MainAreaWidget<EVNWidget>({ content });
            widget.title.label = 'Experiment selection';
            app.shell.add(widget, 'main');
          }
        });

        if (launcher) {
          launcher.add({
            command,
            category: 'EVN Archive',
            rank: 1
          });
        }
      })
      .catch(reason => {
        console.error(
          `The EVN_Archive server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default extension;
