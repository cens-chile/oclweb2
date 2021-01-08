import React from 'react';
import alertifyjs from 'alertifyjs';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { TextField, IconButton, Button } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';
import {
  set, get, map, orderBy, cloneDeep, reject, pullAt, filter, isEmpty
} from 'lodash';
import APIService from '../../services/APIService';
import { arrayToObject } from '../../common/utils';
import { ERROR_RED } from '../../common/constants';
import LocaleForm from './LocaleForm';
import ExtrasForm from './ExtrasForm';


const NAME_MODEL = {
  locale: '', type: '', name: '', external_id: '', locale_preferred: false
}

const DESC_MODEL = {
  locale: '', type: '', description: '', external_id: '', locale_preferred: false
}
const EXTRAS_MODEL = {
  key: '', value: '',
}


class ConceptForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fields: {
        id: '',
        concept_class: '',
        datatype: '',
        external_id: '',
        names: [cloneDeep(NAME_MODEL)],
        descriptions: [cloneDeep(DESC_MODEL)],
        extras: [cloneDeep(EXTRAS_MODEL)],
      },
      fieldErrors: {},
      serverErrors: null,
      idHelperTexts: ['Alphanumeric characters, hyphens, periods, and underscores are allowed.'],
      conceptClasses: [],
      datatypes: [],
      locales: [],
      nameTypes: [],
      descriptionTypes: [],
    }
  }

  componentDidMount() {
    this.fetchConceptClasses();
    this.fetchDatatypes();
    this.fetchLocales();
    this.fetchNameTypes();
    this.fetchDescriptionTypes();
  }

  getIdHelperText() {
    const id = this.state.fields.id || "[concept-id]"
    return (
      <span>
        <span>Alphanumeric characters, hyphens, periods, and underscores are allowed.</span>
        <br />
        <span>
          <span>Your new concept will live at: <br />
            https://qa.openconceptlab.org/users/admin/sources/TDPWypR8FgY/concepts/</span>
          <span><b>{id}</b>/</span>
        </span>
      </span>
    )
  }

  onTextFieldChange = event => {
    this.setFieldValue(event.target.id, event.target.value)
  }

  fetchConceptClasses() {
    APIService.sources('Classes').concepts()
              .get(null, null, {limit: 1000})
              .then(response => this.setState({
                conceptClasses: orderBy(map(response.data, cc => ({id: cc.id, name: cc.id})), 'name')
              }))
  }
  fetchDatatypes() {
    APIService.sources('Datatypes').concepts()
              .get(null, null, {limit: 1000})
              .then(response => this.setState({
                datatypes: orderBy(map(response.data, dt => ({id: dt.id, name: dt.id})), 'name')
              }))
  }

  fetchLocales() {
    APIService.sources('Locales').concepts()
              .get(null, null, {limit: 1000})
              .then(response => this.setState({
                locales: orderBy(map(reject(response.data, {locale: null}), l => ({id: l.locale, name: `${l.display_name} [${l.locale}]`})), 'name')
              }))
  }

  fetchNameTypes() {
    APIService.sources('NameTypes').concepts()
              .get(null, null, {limit: 1000})
              .then(response => this.setState({
                nameTypes: orderBy(map(response.data, nt => ({id: nt.display_name, name: nt.display_name})), 'name')
              }))
  }

  fetchDescriptionTypes() {
    APIService.sources('DescriptionTypes').concepts()
              .get(null, null, {limit: 1000})
              .then(response => this.setState({
                descriptionTypes: orderBy(map(response.data, nt => ({id: nt.display_name, name: nt.display_name})), 'name')
              }))
  }

  onAutoCompleteChange = (id, item) => {
    this.setFieldValue(id, get(item, 'id', ''))
  }

  onCheckboxChange = (id, value) => {
    this.setFieldValue(id, value)
  }

  onAddNameLocale = () => {
    this.setFieldValue('fields.names', [...this.state.fields.names, cloneDeep(NAME_MODEL)])
  }

  onAddDescLocale = () => {
    this.setFieldValue('fields.descriptions', [...this.state.fields.descriptions, cloneDeep(DESC_MODEL)])
  }

  onAddExtras = () => {
    this.setFieldValue('fields.extras', [...this.state.fields.extras, cloneDeep(EXTRAS_MODEL)])
  }

  setFieldValue(id, value) {
    const newState = {...this.state}
    set(newState, id, value)

    const fieldName = get(id.split('fields.'), '1')
    if(fieldName && !isEmpty(value) && get(newState.fieldErrors, fieldName))
      newState.fieldErrors[fieldName] = null
    this.setState(newState)
  }

  onDeleteNameLocale = index => {
    const newState = {...this.state}
    pullAt(newState.fields.names, index)
    this.setState(newState)
  }

  onDeleteDescLocale = index => {
    const newState = {...this.state}
    pullAt(newState.fields.descriptions, index)
    this.setState(newState)
  }

  onDeleteExtras = index => {
    const newState = {...this.state}
    pullAt(newState.fields.extras, index)
    this.setState(newState)
  }

  onExtrasChange = (index, key, value) => {
    const newState = {...this.state}
    if(key !== '__')
      newState.fields.extras[index].key = key
    if(value !== '__')
      newState.fields.extras[index].value = value
    this.setState(newState)
  }

  onSubmit = () => {
    const { parentURL, reloadOnSuccess, onCancel } = this.props
    const fields = cloneDeep(this.state.fields);
    const isFormValid = document.getElementsByTagName('form')[0].checkValidity()
    if(parentURL && isFormValid) {
      fields.extras = arrayToObject(fields.extras)
      fields.names = this.cleanLocales(fields.names)
      fields.descriptions = this.cleanLocales(fields.descriptions)
      APIService.new().overrideURL(parentURL).appendToUrl('concepts/').post(fields).then(response => {
        if(response.status === 201) { // success
          alertifyjs.success('Successfully created concept', 1, () => {
            reloadOnSuccess ? window.location.reload() : onCancel()
          })
        } else { // error
          const genericError = get(response, '__all__')
          if(genericError) {
            alertifyjs.error(genericError.join('\n'))
          } else {
            this.setState(
              {fieldErrors: response || {}},
              () => alertifyjs.error('Please fill mandatory fields.')
            )
          }
        }
      })
    }
  }

  cleanLocales(locales) {
    return filter(locales, locale => {
      return locale.locale && locale.type && (get(locale, 'name') || get(locale, 'description'))
    })
  }

  render() {
    const {
      fieldErrors, fields, conceptClasses, datatypes, locales, nameTypes,
      descriptionTypes
    } = this.state;
    const { onCancel } = this.props;
    return (
      <div className='col-md-12' style={{marginBottom: '30px'}}>
        <div className='col-md-12 no-side-padding'>
          <h3>New Concept</h3>
        </div>
        <div className='col-md-12 no-side-padding'>
          <form>
            <div style={{width: '100%'}}>
              <TextField
                error={Boolean(fieldErrors.id)}
                id="fields.id"
                label="Concept ID"
                placeholder="e.g. A15.0"
                helperText={this.getIdHelperText()}
                variant="outlined"
                fullWidth
                required
                onChange={this.onTextFieldChange}
                value={fields.id}
              />
            </div>
            <div style={{marginTop: '15px', width: '100%'}}>
              <Autocomplete
                id="fields.concept_class"
                options={conceptClasses}
                getOptionLabel={(option) => option.name}
                fullWidth
                required
                renderInput={
                  params => <TextField
                              {...params}
                              error={Boolean(fieldErrors.concept_class)}
                                    required
                                    label="Concept Class"
                                    variant="outlined"
                                    fullWidth
                  />
                }
                onChange={(event, item) => this.onAutoCompleteChange('fields.concept_class', item)}
              />
            </div>
            <div style={{marginTop: '15px', width: '100%'}}>
              <Autocomplete
                id="fields.datatype"
                options={datatypes}
                getOptionLabel={(option) => option.name}
                fullWidth
                required
                renderInput={(params) => <TextField {...params} error={Boolean(fieldErrors.datatype)} required label="Datatype" variant="outlined" fullWidth />}
                onChange={(event, item) => this.onAutoCompleteChange('fields.datatype', item)}
              />
            </div>
            <div style={{marginTop: '15px', width: '100%'}}>
              <TextField
                id="fields.external_id"
                label="External ID"
                placeholder="e.g. UUID from external system"
                variant="outlined"
                fullWidth
                onChange={this.onTextFieldChange}
                value={fields.external_id}
              />
            </div>
            <div className='col-md-12 no-side-padding' style={{marginTop: '15px', width: '100%'}}>
              <div className='col-md-8'>
                <h3 style={fieldErrors.names && isEmpty(fields.names) ? {color: ERROR_RED} : {}}>Names & Synonyms</h3>
              </div>
              <div className='col-md-4' style={{textAlign: 'right'}}>
                <IconButton color='primary' onClick={this.onAddNameLocale}>
                  <AddIcon />
                </IconButton>
              </div>
              {
                map(fields.names, (name, index) => (
                  <div className='col-md-12 no-side-padding' key={index} style={index > 0 ? {marginTop: '5px', width: '100%'} : {width: '100%'}}>
                    <LocaleForm
                      error={Boolean(index === 0 && fieldErrors.name)}
                      index={index}
                      localeAttr='fields.names'
                      onTextFieldChange={this.onTextFieldChange}
                      onAutoCompleteChange={this.onAutoCompleteChange}
                      onCheckboxChange={this.onCheckboxChange}
                      locales={locales}
                      types={nameTypes}
                      onDelete={this.onDeleteNameLocale}
                    />
                  </div>
                ))
              }
            </div>
            <div className='col-md-12 no-side-padding' style={{marginTop: '15px', width: '100%'}}>
              <div className='col-md-8'>
                <h3>Descriptions</h3>
              </div>
              <div className='col-md-4' style={{textAlign: 'right'}}>
                <IconButton color='primary' onClick={this.onAddDescLocale}>
                  <AddIcon />
                </IconButton>
              </div>
              {
                map(fields.descriptions, (desc, index) => (
                  <div className='col-md-12 no-side-padding' key={index} style={index > 0 ? {marginTop: '5px', width: '100%'} : {width: '100%'}}>
                    <LocaleForm
                      index={index}
                      localeAttr='fields.descriptions'
                      onTextFieldChange={this.onTextFieldChange}
                      onAutoCompleteChange={this.onAutoCompleteChange}
                      onCheckboxChange={this.onCheckboxChange}
                      locales={locales}
                      types={descriptionTypes}
                      onDelete={this.onDeleteDescLocale}
                    />
                  </div>
                ))
              }
            </div>
            <div className='col-md-12 no-side-padding' style={{marginTop: '15px', width: '100%'}}>
              <div className='col-md-8'>
                <h3>Custom Attributes</h3>
              </div>
              <div className='col-md-4' style={{textAlign: 'right'}}>
                <IconButton color='primary' onClick={this.onAddExtras}>
                  <AddIcon />
                </IconButton>
              </div>
              {
                map(fields.extras, (extra, index) => (
                  <div className='col-md-12 no-side-padding' key={index} style={index > 0 ? {marginTop: '5px', width: '100%'} : {width: '100%'}}>
                    <ExtrasForm
                      index={index}
                      onChange={this.onExtrasChange}
                      onDelete={this.onDeleteExtras}
                    />
                  </div>
                ))
              }
            </div>
            <div className='col-md-12' style={{textAlign: 'center', margin: '20px 0'}}>
              <Button style={{margin: '0 10px'}} color='primary' variant='outlined' type='submit' onClick={this.onSubmit}>
                Create
              </Button>
              <Button style={{margin: '0 10px'}} variant='outlined' onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default ConceptForm;