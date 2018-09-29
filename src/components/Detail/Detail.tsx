import * as React from "react";

export interface DetailProps {
  file: File;
  close: () => void;
}
export interface File {
  key: string;
  name: string;
  extension: string;
  url: string;
}

class Detail extends React.Component<DetailProps, any> {
  public handleCloseClick = (event: React.FormEvent<HTMLInputElement>) => {
    if (event) {
      event.preventDefault();
    }
    this.props.close();
  };

  public render() {
    const name = this.props.file.key.split("/");

    return (
      <div>
        <h2>Item Detail</h2>
        <dl>
          <dt>Key</dt>
          <dd>{this.props.file.key}</dd>

          <dt>Name</dt>
          <dd>{name.length ? name[name.length - 1] : ""}</dd>
        </dl>
        <a href="#" onClick={this.handleCloseClick}>
          Close
        </a>
      </div>
    );
  }
}

export default Detail;
