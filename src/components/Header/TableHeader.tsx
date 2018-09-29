import * as React from 'react';
import { DropTarget } from 'react-dnd'
import { NativeTypes } from 'react-dnd-html5-backend'
import { BaseFileConnectors } from '../BaseFile'

export interface RawTableHeaderProps {
  select: (fileKey: string) => void,
  fileKey: string,
  connectDropTarget: () => void,
  isOver: boolean,
  isSelected: () => void,
  browserProps:RawTableHeaderPropsBrowserProps
};

export type RawTableHeaderPropsBrowserProps = {
  createFiles: () => void,
  moveFolder: () => void,
  moveFile: () => void
};

class RawTableHeader extends React.Component<RawTableHeaderProps, any> {

  handleHeaderClick() {
    this.props.select(this.props.fileKey)
  }

  render() {
    const header = (
      <tr
        className={ClassNames('folder', {
          dragover: this.props.isOver,
          selected: this.props.isSelected,
        })}
      >
        <th>File</th>
        <th className="size">Size</th>
        <th className="modified">Last Modified</th>
      </tr>
    )

    if (
      typeof this.props.browserProps.createFiles === 'function' ||
      typeof this.props.browserProps.moveFile === 'function' ||
      typeof this.props.browserProps.moveFolder === 'function'
    ) {
      return this.props.connectDropTarget(header)
    } else {
      return header
    }
  }
}

@DropTarget(
  ['file', 'folder', NativeTypes.FILE],
  BaseFileConnectors.targetSource,
  BaseFileConnectors.targetCollect,
)
class TableHeader extends RawTableHeader {}

export default TableHeader
export { RawTableHeader }
