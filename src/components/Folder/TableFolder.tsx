import React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'

import { BaseFileConnectors } from '../FileBrowser/BaseFile';
import BaseFolder, { dragCollect, dragSource } from '../FileBrowser/BaseFolder';

class TableFolder extends BaseFolder {
  public render() {
    let icon
    if (this.props.isOpen) {
      icon = (<i className="fa fa-folder-open-o" aria-hidden="true" />)
    } else {
      icon = (<i className="fa fa-folder-o" aria-hidden="true" />)
    }

    const inAction = (this.props.isDragging || this.props.action)

    let name
    if (!inAction && this.props.isDeleting) {
      name = (
        <form className="deleting" onSubmit={this.handleDeleteSubmit}>
          <a
            href={this.props.url}
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
    } else if ((!inAction && this.props.isRenaming) || this.props.isDraft) {
      name = (
        <div>
          <form className="renaming" onSubmit={this.handleRenameSubmit}>
            {icon}
            <input
              type="text"
              ref="newName"
              value={this.state.newName}
              onChange={this.handleNewNameChange}
              onBlur={this.handleCancelEdit}
              autoFocus={true}
            />
          </form>
        </div>
      )
    } else {
      name = (
        <div>
          <a onClick={this.toggleFolder}>
            {icon}
            {this.getName()}
          </a>
        </div>
      )
    }

    if (typeof this.props.browserProps.moveFolder === 'function') {
      name = this.props.connectDragPreview(name)
    }

    const folder = (
      <tr
        className={ClassNames('folder', {
          pending: (this.props.action),
          dragging: (this.props.isDragging),
          dragover: this.props.isOver,
          selected: this.props.isSelected,
        })}
        onClick={this.handleFolderClick}
        onDoubleClick={this.handleFolderDoubleClick}
      >
        <td className="name">
          <div style={{paddingLeft: (this.props.depth * 16) + 'px'}}>
            {name}
          </div>
        </td>
        <td />
        <td />
      </tr>
    )

    return this.connectDND(folder)
  }
}

@DragSource('folder', dragSource, dragCollect)
@DropTarget(
  ['file', 'folder', NativeTypes.FILE],
  BaseFileConnectors.targetSource,
  BaseFileConnectors.targetCollect,
)

export default TableFolder;
