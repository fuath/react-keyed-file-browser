import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import TouchBackend from 'react-dnd-touch-backend';
import { File, PageCount, RenderStyle } from "../../common/Models";
import { groupByFolder } from "../../common/Utils";

const PagingDefault = PageCount.Twenty;
export interface BrowserPropsAndFileBrowserState {
  FileBrowserState: FileBrowserState;
  BrowserProps: BrowserProps;
} 
export interface BrowserProps {
  files?: File[],
  actions?: any,
  canFilter?: boolean,
  activeAction?: ActiveAction,
  group?: () => void,
  sort?: () => void,
  nestChildren?: boolean,
  renderStyle?: RenderStyle,
  headerRenderer?: () => void,
  headerRendererProps?: object,
  filterRenderer?: () => void,
  filterRendererProps?: object,
  fileRenderer?: () => void,
  fileRendererProps?: object,
  folderRenderer?: () => void,
  folderRendererProps?: object,
  detailRenderer?: () => void,
  detailRendererProps?: object,
  onCreateFiles: (files?: any[], prefix?: string) => void | boolean,
  onCreateFolder: (key?: string) => void | boolean,
  onMoveFile: (oldKey?: string, newKey?: string) => void | boolean,
  onMoveFolder: (oldKey?: string, newKey?: string) => void | boolean,
  onRenameFile: (oldKey?: string, newKey?: string) => void | boolean,
  onRenameFolder: (oldKey?: string, newKey?: string) => void | boolean,
  onDeleteFile: (key?: string) => void | boolean,
  onDeleteFolder: (key?: string) => void | boolean,
  getItemProps: (file: File, browserPropsAndState: BrowserPropsAndFileBrowserState) => ItemProps;
};

export interface ItemProps {
  key: string;
  fileKey: string;
  isSelected: boolean;
  isOpen: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  isDraft: boolean;
};

export enum ActiveAction {
  Rename = 'rename', 
  Delete = 'delete', 
  CreateFolder = 'createFolder' 
};

export interface FileBrowserState {
  actionTarget?: string;
  activeAction?: ActiveAction;
  addFolder?: any; // TODO remove?
  nameFilter: string;
  previewFile?: File;
  openFolders: {};
  searchResultsShown: PageCount;
  selection?: any;
};

function getItemProps(file: File, browserPropsAndState: BrowserPropsAndFileBrowserState): ItemProps {
  return {
    fileKey: file.key,
    isDeleting: browserPropsAndState.BrowserProps.activeAction === ActiveAction.Delete && browserPropsAndState.FileBrowserState.actionTarget === file.key,
    isDraft: !!file.draft,
    isOpen: file.key in browserPropsAndState.FileBrowserState.openFolders || !!browserPropsAndState.FileBrowserState.nameFilter, // TODO namefilter as a open flag?
    isRenaming: browserPropsAndState.BrowserProps.activeAction === ActiveAction.Rename && browserPropsAndState.FileBrowserState.actionTarget === file.key,
    isSelected: (file.key === browserPropsAndState.FileBrowserState.selection),
    key: `file-${file.key}`
  };
}

// tslint:disable-next-line:max-classes-per-file
class FileBrowser extends React.Component<BrowserProps, any> {

  public static state = {
    actionTarget: undefined,
    activeAction: undefined,
    addFolder: undefined,
    nameFilter: '',
    openFolders: {},
    previewFile: undefined,
    searchResultsShown: PagingDefault,
    selection: undefined
  }

  public componentDidMount() {
    if (this.props.renderStyle === RenderStyle.Table && this.props.nestChildren) {
     // console.warn('Invalid settings: Cannot nest table children in file browser')
    }

    window.addEventListener('click', this.handleGlobalClick)
  }
  public componentWillUnmount() {
    window.removeEventListener('click', this.handleGlobalClick)
  }

  // item manipulation
  public createFiles = (files: File[], prefix: string) => {
    this.setState((state: FileBrowserState) => {
      if (prefix) {
        state.openFolders[prefix] = true;
      }
      state.selection = undefined;
      return state;
    }, () => this.props.onCreateFiles(files, prefix));
  }

  public createFolder = (key: string) => {
    this.setState((state: FileBrowserState) => {
      state.activeAction = undefined
      state.actionTarget = undefined
      state.selection = key
    }, () => this.props.onCreateFolder(key));
  }
  public moveFile = (oldKey: string, newKey: string) => {
    this.setState({
      actionTarget: undefined,
      activeAction: undefined,
      selection: newKey
    }, () => this.props.onMoveFile(oldKey, newKey));
  }

  public moveFolder = (oldKey: string, newKey: string) => {
    this.setState((state: FileBrowserState) => {
      state.activeAction = undefined
      state.actionTarget = undefined
      state.selection = newKey
      if (oldKey in state.openFolders) {
        delete state.openFolders[newKey]
        state.openFolders[newKey] = true
      }
      return state
    }, () => this.props.onMoveFolder(oldKey, newKey));
  }
  public renameFile = (oldKey: string, newKey: string) => {
    this.setState({
      actionTarget: undefined,
      activeAction: undefined,
      selection: newKey
    }, () => this.props.onRenameFile(oldKey, newKey));
  }
  public renameFolder = (oldKey: string, newKey: string) => {
    this.setState((state: FileBrowserState) => {
      state.activeAction = undefined
      state.actionTarget = undefined
      if (state.selection.substr(0, oldKey.length) === oldKey) {
        state.selection = state.selection.replace(oldKey, newKey)
      }
      if (oldKey in state.openFolders) {
        delete state.openFolders[newKey]
        state.openFolders[newKey] = true
      }
      return state;
    }, () => this.props.onRenameFolder(oldKey, newKey));
  }
  public deleteFile = (key: string) => {
    this.setState({
      actionTarget: undefined,
      activeAction: undefined,
      selection: undefined,
    }, () => this.props.onDeleteFile(key));
  }
  public deleteFolder = (key: string) => {
    this.setState((state: FileBrowserState) => {
      state.activeAction = undefined
      state.actionTarget = undefined
      state.selection = undefined
      if (key in state.openFolders) {
        delete state.openFolders[key]
      }
      return state
    }, () => this.props.onDeleteFolder(key));
  }

  // browser manipulation
  public beginAction = (action?: any, key?: string) => {
    this.setState((state: FileBrowserState) => {
      state.activeAction = action
      state.actionTarget = key
      return state
    })
  }
  public endAction = () => {
    if (this.state.selection && this.state.selection.indexOf('__new__') !== -1) {
      this.setState({selection: undefined})
    }
    this.beginAction()
  }
  public select = (key: string) => {
    this.setState((state: FileBrowserState) => {
      state.selection = key
      if (state.actionTarget && state.actionTarget !== key) {
        state.actionTarget = undefined;
        state.activeAction = undefined;
      }
      return state
    })
  }
  public preview = (file: File) => {
    this.setState((state: FileBrowserState) => {
      state.previewFile = file;
      return state;
    })
  }
  public closeDetail = () => {
    this.setState((state: FileBrowserState) => {
      state.previewFile = undefined
      return state
    })
  }

  public handleShowMoreClick = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    this.setState((state: FileBrowserState) => {
      state.searchResultsShown += PagingDefault;
      return state
    })
  }
  public toggleFolder = (folderKey: string) => {
    this.setState((state: FileBrowserState) => {
      if (folderKey in state.openFolders) {
        delete state.openFolders[folderKey]
      } else {
        state.openFolders[folderKey] = true;
      }
      return state;
    })
  }
  public openFolder = (folderKey: string) => {
    this.setState((state: FileBrowserState) => {
      state.openFolders[folderKey] = true
      return state
    })
  }

  // event handlers
  public handleGlobalClick = (event: React.FormEvent<HTMLInputElement>) => {
    const inBrowser = !!(this.refs.browser.contains(event.target))
    const inPreview = !!(
      typeof this.refs.preview !== 'undefined' && this.refs.preview.contains(event.target)
    )
    if (!inBrowser && !inPreview) {
      this.setState((state: FileBrowserState) => {
        state.selection = undefined;
        state.actionTarget = undefined;
        state.activeAction = undefined;
        return state
      })
    }
  }
  public handleActionBarRenameClick = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    this.beginAction(ActiveAction.Rename, this.state.selection)
  }
  public handleActionBarDeleteClick = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    this.beginAction(ActiveAction.Delete, this.state.selection)
  }
  public handleActionBarAddFolderClick = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (this.state.activeAction === ActiveAction.CreateFolder) {
      return
    }
    let addKey = ''
    if (this.state.selection) {
      addKey += this.state.selection
      if (addKey.substr(addKey.length - 1, addKey.length) !== '/') {
        addKey += '/'
      }
    }
    addKey += '__new__/';
    this.setState((state: FileBrowserState) => {
      state.actionTarget = addKey;
      state.activeAction = ActiveAction.CreateFolder;
      state.selection = addKey
      if (this.state.selection) {
        state.openFolders[this.state.selection] = true
      }
      return state
    })
  }
  public updateFilter = (newValue: string) => {
    this.setState((state: FileBrowserState) => {
      state.nameFilter = newValue
      state.searchResultsShown = PagingDefault
      return state
    })
  }

  public getBrowserProps(): BrowserProps {
    return {
      // browser config
      nestChildren: this.props.nestChildren,
      fileRenderer: this.props.fileRenderer,
      fileRendererProps: this.props.fileRendererProps,
      folderRenderer: this.props.folderRenderer,
      folderRendererProps: this.props.folderRendererProps,

      // browser state
      openFolders: this.state.openFolders,
      nameFilter: this.state.nameFilter,
      selection: this.state.selection,
      activeAction: this.state.activeAction,
      actionTarget: this.state.actionTarget,

      // browser manipulation
      select: this.select,
      openFolder: this.openFolder,
      toggleFolder: this.toggleFolder,
      beginAction: this.beginAction,
      endAction: this.endAction,
      preview: this.preview,

      // item manipulation
      createFiles: this.props.onCreateFiles ? this.createFiles : undefined,
      createFolder: this.props.onCreateFolder ? this.createFolder : undefined,
      renameFile: this.props.onRenameFile ? this.renameFile : undefined,
      renameFolder: this.props.onRenameFolder ? this.renameFolder : undefined,
      moveFile: this.props.onMoveFile ? this.moveFile : undefined,
      moveFolder: this.props.onMoveFolder ? this.moveFolder : undefined,
      deleteFile: this.props.onDeleteFile ? this.deleteFile : undefined,
      deleteFolder: this.props.onDeleteFolder ? this.deleteFolder : undefined,

      getItemProps
    }
  }
  public renderActionBar(selectedItem) {
    const selectionIsFolder = (selectedItem && !selectedItem.size)
    let filter
    if (this.props.canFilter) {
      filter = (
        <this.props.filterRenderer
          value={this.state.nameFilter}
          updateFilter={this.updateFilter}
          {...this.props.filterRendererProps}
        />
      )
    }

    let actions
    if (selectedItem) {
      // Something is selected. Build custom actions depending on what it is.
      if (selectedItem.action) {
        // Selected item has an active action against it. Disable all other actions.
        let actionText
        switch (selectedItem.action) {
          case ActiveAction.Delete:
            actionText = 'Deleting ...'
            break

          case ActiveAction.Rename:
            actionText = 'Renaming ...'
            break

          default:
            actionText = 'Moving ...'
            break
        }
        actions = (
          // TODO: Enable plugging in custom spinner.
          <div className="item-actions">
            <i className="icon loading fa fa-circle-o-notch fa-spin" /> {actionText}
          </div>
        )
      } else {
        actions = []
        if (
          selectionIsFolder &&
          typeof this.props.onCreateFolder === 'function' &&
          !this.state.nameFilter
        ) {
          actions.push(
            <li key="action-add-folder">
              <a
                onClick={this.handleActionBarAddFolderClick}
                href="#"
                role="button"
              >
                <i className="fa fa-folder-o" aria-hidden="true" />
                &nbsp;Add Subfolder
              </a>
            </li>
          )
        }
        if (
          selectedItem.keyDerived && (
            (!selectionIsFolder && typeof this.props.onRenameFile === 'function') ||
            (selectionIsFolder && typeof this.props.onRenameFolder === 'function')
          )
        ) {
          actions.push(
            <li key="action-rename">
              <a
                onClick={this.handleActionBarRenameClick}
                href="#"
                role="button"
              >
                <i className="fa fa-i-cursor" aria-hidden="true" />
                &nbsp;Rename
              </a>
            </li>
          )
        }
        if (
          selectedItem.keyDerived && (
            (!selectionIsFolder && typeof this.props.onDeleteFile === 'function') ||
            (selectionIsFolder && typeof this.props.onDeleteFolder === 'function')
          )
        ) {
          actions.push(
            <li key="action-delete">
              <a
                onClick={this.handleActionBarDeleteClick}
                href="#"
                role="button"
              >
                <i className="fa fa-trash-o" aria-hidden="true" />
                &nbsp;Delete
              </a>
            </li>
          )
        }
        if (actions.length) {
          actions = (<ul className="item-actions">{actions}</ul>)
        } else {
          actions = (<div className="item-actions">&nbsp;</div>)
        }
      }
    } else {
      // Nothing selected: We're in the 'root' folder. Only allowed action is adding a folder.
      actions = []
      if (
        typeof this.props.onCreateFolder === 'function' &&
        !this.state.nameFilter
      ) {
        actions.push(
          <li key="action-add-folder">
            <a
              onClick={this.handleActionBarAddFolderClick}
              href="#"
              role="button"
            >
              <i className="fa fa-folder-o" aria-hidden="true" />
              &nbsp;Add Folder
            </a>
          </li>
        )
      }
      if (actions.length) {
        actions = (<ul className="item-actions">{actions}</ul>)
      } else {
        actions = (<div className="item-actions">&nbsp;</div>)
      }
    }

    return (
      <div className="action-bar">
        {filter}
        {actions}
      </div>
    )
  }
  public renderFiles(files: File[], depth: number) {
    const browserProps = this.getBrowserProps();
    let renderedFiles = []
    files.map((file) => {
      const thisItemProps = {
        ...browserProps.getItemProps(file, browserProps),
        depth: this.state.nameFilter ? 0 : depth,
      }

      if (file.size) {
        renderedFiles.push(
          <this.props.fileRenderer
            {...file}
            {...thisItemProps}
            browserProps={browserProps}
            {...this.props.fileRendererProps}
          />
        )
      } else {
        if (!this.state.nameFilter) {
          renderedFiles.push(
            <this.props.folderRenderer
              {...file}
              {...thisItemProps}
              browserProps={browserProps}
              {...this.props.folderRendererProps}
            />
          )
        }
        if (this.state.nameFilter || (thisItemProps.isOpen && !browserProps.nestChildren)) {
          renderedFiles = renderedFiles.concat(this.renderFiles(file.children, depth + 1))
        }
      }
    })
    return renderedFiles
  }
  public render() {
    const browserProps = this.getBrowserProps()
    const headerProps = {
      fileKey: '',
      fileCount: this.props.files.length,
      browserProps,
    }
    let renderedFiles

    let files = this.props.files.concat([])
    if (this.state.activeAction === ActiveAction.CreateFolder) {
      files.push({
        key: this.state.actionTarget,
        size: 0,
        draft: true,
      })
    }
    if (this.state.nameFilter) {
      const filteredFiles = []
      const terms = this.state.nameFilter.toLowerCase().split(' ')
      files.map((file) => {
        let skip = false
        terms.map((term) => {
          if (file.key.toLowerCase().trim().indexOf(term) === -1) {
            skip = true
          }
        })
        if (skip) {
          return
        }
        filteredFiles.push(file)
      })
      files = filteredFiles
    }
    if (typeof this.props.group === 'function') {
      files = this.props.group(files, '')
    } else {
      const newFiles = []
      files.map((file) => {
        if (file.size) {
          newFiles.push(file)
        }
      })
      files = newFiles
    }
    let selectedItem;
    const findSelected = (item: File) => {
      if (item.key === this.state.selection) {
        selectedItem = item
      }
      if (item.children) {
        item.children.map(findSelected)
      }
    }
    files.map(findSelected)
    if (typeof this.props.sort === 'function') {
      files = this.props.sort(files)
    }

    let header
    let contents = this.renderFiles(files, 0)
    switch (this.props.renderStyle) {
      case RenderStyle.Table:
        if (!contents.length) {
          if (this.state.nameFilter) {
            contents = (<tr>
              <td colSpan={100}>
                No files matching "{this.state.nameFilter}".
              </td>
            </tr>)
          } else {
            contents = (<tr>
              <td colSpan={100}>
                No files.
              </td>
            </tr>)
          }
        } else {
          if (this.state.nameFilter) {
            const numFiles = contents.length
            contents = contents.slice(0, this.state.searchResultsShown)
            if (numFiles > contents.length) {
              contents.push(<tr key="show-more">
                <td colSpan={100}>
                  <a
                    onClick={this.handleShowMoreClick}
                    href="#"
                  >
                    Show more results
                  </a>
                </td>
              </tr>)
            }
          }
        }

        if (this.props.headerRenderer) {
          header = (
            <thead>
              <this.props.headerRenderer
                {...headerProps}
                {...this.props.headerRendererProps}
              />
            </thead>
          )
        }

        renderedFiles = (
          <table cellSpacing="0" cellPadding="0">
            {header}
            <tbody>
              {contents}
            </tbody>
          </table>
        )
        break

      case RenderStyle.List:
        if (!contents.length) {
          if (this.state.nameFilter) {
            contents = (<p className="empty">No files matching "{this.state.nameFilter}"</p>)
          } else {
            contents = (<p className="empty">No files.</p>)
          }
        } else {
          let more
          if (this.state.nameFilter) {
            const numFiles = contents.length
            contents = contents.slice(0, this.state.searchResultsShown)
            if (numFiles > contents.length) {
              more = (<a
                onClick={this.handleShowMoreClick}
                href="#"
              >
                Show more results
              </a>)
            }
          }
          contents = (
            <div>
              <ul>{contents}</ul>
              {more}
            </div>
          )
        }

        if (this.props.headerRenderer) {
          header = (
            <this.props.headerRenderer
              {...headerProps}
              {...this.props.headerRendererProps}
            />
          )
        }

        renderedFiles = (
          <div>
            {header}
            {contents}
          </div>
        )
        break
    }
    
    const browserRef = () => "browser";
    return (
      <div className="rendered-react-keyed-file-browser">
        {this.props.actions}
        <div className="rendered-file-browser" ref={browserRef}>
            <ActionBarHOC 
              selectedItems={selectedItem} 
            />
          <div className="files">
            <HeaderHOC
               
            />
            <ContentHOC 
            />
          </div>
        </div>
        {this.state.previewFile && 
          <DetailRenderer
            file={this.state.previewFile}
            close={this.closeDetail}
            detailRendererProps={this.props.detailRendererProps}
          />
        }
      </div>
    )
  }
}

DragDropContext(TouchBackend);
export default FileBrowser;