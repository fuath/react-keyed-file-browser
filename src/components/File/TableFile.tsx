import * as React from 'react'
import Moment from 'moment'
import ClassNames from 'classnames'
import { DragSource, DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

import BaseFile, { BaseFileConnectors } from '../BaseFile'
import { fileSize } from 'src/Utils'

class RawTableFile extends BaseFile {
  render() {
    let icon
    if (this.isImage()) {
      icon = (<i className="fa fa-file-image-o" aria-hidden="true" />)
    } else if (this.isPdf()) {
      icon = (<i className="fa fa-file-pdf-o" aria-hidden="true" />)
    } else {
      icon = (<i className="fa fa-file-o" aria-hidden="true" />)
    }

    const inAction = (this.props.isDragging || this.props.action)

    let name
    if (!inAction && this.props.isDeleting) {
      name = (
        <form className="deleting" onSubmit={this.handleDeleteSubmit}>
          <a
            href={this.props.url || '#'}
            download="download"
            onClick={this.handleFileClick}
          >
            {icon}
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
          {icon}
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
        <a
          href={this.props.url || '#'}
          download="download"
          onClick={this.handleFileClick}
        >
          {icon}
          {this.getName()}
        </a>
      )
    }

    let draggable = (
      <div>
        {name}
      </div>
    )
    if (typeof this.props.browserProps.moveFile === 'function') {
      draggable = this.props.connectDragPreview(draggable)
    }

    let row = (
      <tr
        className={ClassNames('file', {
          pending: (this.props.action),
          dragging: (this.props.isDragging),
          dragover: (this.props.isOver),
          selected: (this.props.isSelected),
        })}
        onClick={this.handleItemClick}
        onDoubleClick={this.handleItemDoubleClick}
      >
        <td className="name">
          <div style={{paddingLeft: (this.props.depth * 16) + 'px'}}>
            {draggable}
          </div>
        </td>
        <td className="size">{fileSize(this.props.size)}</td>
        <td className="modified">
          {typeof this.props.modified === 'undefined' ? '-' : Moment(this.props.modified, 'x').fromNow()}
        </td>
      </tr>
    )

    return this.connectDND(row)
  }
}

@DragSource('file', BaseFileConnectors.dragSource, BaseFileConnectors.dragCollect)
@DropTarget(
  ['file', 'folder', NativeTypes.FILE],
  BaseFileConnectors.targetSource,
  BaseFileConnectors.targetCollect,
)
class TableFile extends RawTableFile {}

export { RawTableFile }
export default TableFile
