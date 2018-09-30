import Moment from 'moment'
import { fileSize } from '../common'
import { DragSource, DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

import BaseFile, { BaseFileConnectors, BaseFileProps } from '../FileBrowser/BaseFile'

export interface ListThumbnailFileProps extends BaseFileProps {
  showName: true,
  showSize: true,
  showModified: true,
  isSelectable: true
}

class ListThumbnailFile extends BaseFile {

  render() {
    let icon
    if (this.props.thumbnail_url) {
      icon = (
        <div className="image" style={{
          backgroundImage: 'url(' + this.props.thumbnail_url + ')',
        }} />
      )
    } else if (this.isImage()) {
      icon = (<i className="fa fa-file-image-o" aria-hidden="true" />)
    } else if (this.isPdf()) {
      icon = (<i className="fa fa-file-pdf-o" aria-hidden="true" />)
    } else {
      icon = (<i className="fa fa-file-o" aria-hidden="true" />)
    }

    const inAction = (this.props.isDragging || this.props.action)

    let name
    if (this.props.showName) {
      if (!inAction && this.props.isDeleting) {
        name = (
          <form className="deleting" onSubmit={this.handleDeleteSubmit}>
            <a
              href={this.props.url}
              download="download"
              onClick={this.handleFileClick}
            >
              {this.getName()}
            </a>
            <div>
              <button type="submit">
                Confirm Deletion
              </button>
            </div>
          </form>
        )
      } else if (!inAction && this.props.isRenaming) {
        name = (
          <form className="renaming" onSubmit={this.handleRenameSubmit}>
            <input
              ref="newName"
              type="text"
              value={this.state.newName}
              onChange={this.handleNewNameChange}
              onBlur={this.handleCancelEdit}
              autoFocus
            />
          </form>
        )
      } else {
        name = (
          <a href={this.props.url} download="download" onClick={this.handleFileClick}>
            {this.getName()}
          </a>
        )
      }
    }

    let size
    if (this.props.showSize) {
      if (!this.props.isRenaming && !this.props.isDeleting) {
        size = (
          <span className="size"><small>{fileSize(this.props.size)}</small></span>
        )
      }
    }
    let modified
    if (this.props.showModified) {
      if (!this.props.isRenaming && !this.props.isDeleting) {
        modified = (
          <span className="modified">
            Last modified: {Moment(this.props.modified).fromNow()}
          </span>
        )
      }
    }

    let rowProps = {}
    if (this.props.isSelectable) {
      rowProps = {
        onClick: this.handleItemClick,
      }
    }

    let row = (
      <li
        className={ClassNames('file', {
          pending: (this.props.action),
          dragging: (this.props.isDragging),
          dragover: (this.props.isOver),
          selected: (this.props.isSelected),
        })}
        onDoubleClick={this.handleItemDoubleClick}
        {...rowProps}
      >
        <div className="item">
          <span className="thumb">{icon}</span>
          <span className="name">{name}</span>
          {size}
          {modified}
        </div>
      </li>
    )
    if (typeof this.props.browserProps.moveFile === 'function') {
      row = this.props.connectDragPreview(row)
    }

    return this.connectDND(row)
  }
}

@DragSource('file', BaseFileConnectors.dragSource, BaseFileConnectors.dragCollect)
@DropTarget(
  ['file', 'folder', NativeTypes.FILE],
  BaseFileConnectors.targetSource,
  BaseFileConnectors.targetCollect,
)

export default ListThumbnailFile;

