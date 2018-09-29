import * as React from 'react';

export interface BaseFolderprops {
  name: string,
  fileKey: string,
  newName: string,
  keyDerived: boolean,
  isDraft: boolean,
  isRenaming: boolean,
  isDeleting: boolean,

  connectDragSource: () => void,
  connectDropTarget: () => void,
  isDragging: boolean,
  action: string,
  browserProps: BrowserProps
};

export type BrowserProps = {
  select: () => void,
  toggleFolder: () => void,
  beginAction: () => void,
  endAction: () => void,
  preview: () => void,
  createFiles: () => void,
  createFolder: () => void,
  moveFile: () => void,
  moveFolder: () => void,
  renameFolder: () => void,
  deleteFolder: () => void,
};

class BaseFolder extends React.Component<BaseFolderprops, any> {
  state = {
    newName: this.props.isDraft ? 'New folder' : this.getName(),
  }

  componentDidMount() {
    if (this.props.isDraft) {
      this.selectAllNewName()
    }
  }
  componentDidUpdate(oldProps) {
    if (!oldProps.isRenaming && this.props.isRenaming) {
      this.selectAllNewName()
    }
  }
  selectAllNewName = () => {
    window.requestAnimationFrame(() => {
      const currentName = this.refs.newName.value
      this.refs.newName.setSelectionRange(0, currentName.length)
      this.refs.newName.focus()
    })
  }

  getName() {
    if (this.props.name) {
      return this.props.name
    }
    const folders = this.props.fileKey.split('/')
    return this.props.newName || folders[folders.length - 2]
  }

  handleFolderClick = (event: React.FormEvent<HTMLInputElement>) => {
    event.stopPropagation()
    this.props.browserProps.select(this.props.fileKey)
  }
  handleFolderDoubleClick = (event: React.FormEvent<HTMLInputElement>) => {
    event.stopPropagation()
    this.toggleFolder()
  }

  handleRenameClick = (event: React.FormEvent<HTMLInputElement>) => {
    if (!this.props.browserProps.renameFolder) {
      return
    }
    this.props.browserProps.beginAction('rename', this.props.fileKey)
  }
  handleNewNameChange = (event: React.FormEvent<HTMLInputElement>) => {
    const newName = this.refs.newName.value
    this.setState({newName: newName})
  }
  handleRenameSubmit = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (!this.props.browserProps.renameFolder) {
      return
    }
    const newName = this.state.newName.trim()
    if (newName.length === 0) {
      // todo: move to props handler
      // window.notify({
      //   style: 'error',
      //   title: 'Invalid new folder name',
      //   body: 'Folder name cannot be blank',
      // })
      return
    }
    if (newName.indexOf('/') !== -1) {
      // todo: move to props handler
      // window.notify({
      //   style: 'error',
      //   title: 'Invalid new folder name',
      //   body: 'Folder names cannot contain forward slashes.',
      // })
      return
    }
    let newKey = this.props.fileKey.substr(0, this.props.fileKey.substr(0, this.props.fileKey.length - 1).lastIndexOf('/'))
    if (newKey.length) {
      newKey += '/'
    }
    newKey += newName
    newKey += '/'
    if (this.props.isDraft) {
      this.props.browserProps.createFolder(newKey)
    } else {
      this.props.browserProps.renameFolder(this.props.fileKey, newKey)
    }
  }

  handleDeleteClick = (event: React.FormEvent<HTMLInputElement>) => {
    if (!this.props.browserProps.deleteFolder) {
      return
    }
    this.props.browserProps.beginAction('delete', this.props.fileKey)
  }
  handleDeleteSubmit = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault()
    if (!this.props.browserProps.deleteFolder) {
      return
    }
    this.props.browserProps.deleteFolder(this.props.fileKey)
  }

  handleCancelEdit = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.browserProps.endAction()
  }

  toggleFolder = () => {
    this.props.browserProps.toggleFolder(this.props.fileKey)
  }

  connectDND(render) {
    const inAction = (this.props.isDragging || this.props.action)
    if (this.props.keyDerived) {
      if (
        typeof this.props.browserProps.moveFolder === 'function' &&
        !inAction &&
        !this.props.isRenaming &&
        !this.props.isDeleting
      ) {
        render = this.props.connectDragSource(render)
      }
      if (
        typeof this.props.browserProps.createFiles === 'function' ||
        typeof this.props.browserProps.moveFolder === 'function' ||
        typeof this.props.browserProps.moveFile === 'function'
      ) {
        render = this.props.connectDropTarget(render)
      }
    }
    return render
  }
}

const folderDragSource = {
  beginDrag(props) {
    props.browserProps.select(props.fileKey)
    return {
      key: props.fileKey,
    }
  },

  endDrag(props, monitor) {
    if (!monitor.didDrop()) {
      return
    }

    const dropResult = monitor.getDropResult()

    const fileNameParts = props.fileKey.split('/')
    const folderName = fileNameParts[fileNameParts.length - 2]

    const newKey = `${dropResult.path}${folderName}/`
    // abort if the new folder name contains itself
    if (newKey.substr(0, props.fileKey.length) === props.fileKey) {
      return;
    };

    if (newKey !== props.fileKey && props.browserProps.renameFolder) {
      props.browserProps.openFolder(dropResult.path)
      props.browserProps.renameFolder(props.fileKey, newKey)
    }
  },
}

function folderDragCollect(connect, monitor) {
  return {
    connectDragPreview: connect.dragPreview(),
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
}

export default BaseFolder;

export {
  folderDragSource, folderDragCollect
};


