import React from 'react';
import { InputBase, Divider, IconButton, Tooltip, Menu, Button, MenuItem  } from '@material-ui/core';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Menu as MenuIcon,
} from '@material-ui/icons';
import { map, get } from 'lodash';

const DEFAULT_FHIR_ATTRIBUTE = {id: 'name', label: 'Name'}

const FHIR_ATTRIBUTES = [
  {id: '_id', label: 'id'},
  {id: 'date', label: 'Release Date'},
  {id: 'status', label: 'Status'},
  DEFAULT_FHIR_ATTRIBUTE,
  {id: 'version', label: 'Version'},
  {id: 'description', label: 'Description'},
]
class SearchByAttributeInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      input: '',
      attrs: FHIR_ATTRIBUTES,
      selectedAttribute: DEFAULT_FHIR_ATTRIBUTE,
      anchorEl: null,
    }
  }

  toggleAnchorEl = event => this.setState({anchorEl: this.state.anchorEl ? null : event.currentTarget})

  performSearch = () => {
    const { selectedAttribute, input } = this.state;
    const id = get(selectedAttribute, 'id')
    const params = id ? {[id]: input || ''} : {}
    this.props.onSearch(params)
  }

  clearSearch = () => this.setState({input: '', anchorEl: null}, this.performSearch)

  handleInputChange = event => this.setState({input: event.target.value || ''})

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.performSearch()
    }
    return false
  }

  render() {
    const { attrs, input, selectedAttribute, anchorEl } = this.state;
    const { searchInputPlaceholder } = this.props;

    return (
      <div className='col-sm-12 no-side-padding'>
        <div className='col-sm-12 no-side-padding' style={{marginBottom: '0px', display: 'flex', alignItems: 'center', border: '1px solid darkgray', borderRadius: '4px'}}>
          <Button className='search-attribute-menu-button' color='primary' variant='text' startIcon={<MenuIcon fontSize='inherit'/>} onClick={this.toggleAnchorEl}>
            {get(selectedAttribute, 'label')}
          </Button>
          <InputBase
            style={{flex: 1, marginLeft: '10px'}}
            placeholder={searchInputPlaceholder || "Search OCL"}
            inputProps={{ 'aria-label': 'search ocl' }}
            value={input || ''}
            fullWidth
            onChange={this.handleInputChange}
            onKeyPress={this.handleKeyPress}
          />
          {
            input &&
            <React.Fragment>
            <Tooltip title='Clear'>
              <IconButton type="submit" style={{padding: '10px'}} aria-label="clear" onClick={this.clearSearch}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <Divider style={{height: '28px', margin: '4px'}} orientation="vertical" />
            </React.Fragment>
          }
          <Tooltip title='Search'>
            <IconButton type="submit" style={{padding: '10px'}} aria-label="search" onClick={this.performSearch}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </div>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.toggleAnchorEl}>
          {
            map(attrs, attr => (
              <MenuItem key={attr.id} onClick={() => this.setState({selectedAttribute: attr, anchorEl: null})}>
                {attr.label}
              </MenuItem>
            ))
          }
        </Menu>
      </div>
    )
  }
}

export default SearchByAttributeInput;
