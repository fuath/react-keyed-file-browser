import * as React from 'react';

export interface FilterProps {
  value: string,
  updateFilter: () => void;
};

class Filter extends React.Component<FilterProps, any> {

  handleFilterChange = () => {
    const newValue = this.refs.filter.value
    this.props.updateFilter(newValue)
  }

  render() {
    return (
      <input
        ref="filter"
        type="search"
        placeholder="Filter files"
        value={this.props.value}
        onChange={this.handleFilterChange}
      />
    )
  }
}

export default Filter;
