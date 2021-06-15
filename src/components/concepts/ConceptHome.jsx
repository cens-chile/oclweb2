import React from 'react';
import { CircularProgress } from '@material-ui/core';
import { includes, get, isObject } from 'lodash';
import APIService from '../../services/APIService';
import ConceptHomeHeader from './ConceptHomeHeader';
import ConceptHomeTabs from './ConceptHomeTabs';
import NotFound from '../common/NotFound';
import AccessDenied from '../common/AccessDenied';
import PermissionDenied from '../common/PermissionDenied';

const TABS = ['details', 'mappings', 'history'];

class ConceptHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notFound: false,
      accessDenied: false,
      permissionDenied: false,
      isLoading: true,
      isLoadingMappings: false,
      concept: {},
      versions: [],
      mappings: [],
      tab: this.getDefaultTabIndex(),
    }
  }

  componentDidMount() {
    this.refreshDataByURL()
  }

  componentDidUpdate(prevProps) {
    if(prevProps.location.pathname !== this.props.location.pathname) {
      this.refreshDataByURL()
      this.onTabChange(null, this.getDefaultTabIndex())
    }
  }

  getDefaultTabIndex() {
    const { location } = this.props;

    if(location.pathname.indexOf('/mappings') > -1)
      return 0;
    if(location.pathname.indexOf('/history') > -1)
      return 1;

    return 0;
  }

  getConceptURLFromPath() {
    let uri;
    const { location, match } = this.props;
    if(location.pathname.indexOf('/details') > -1)
      uri = location.pathname.split('/details')[0] + '/'
    else if(location.pathname.indexOf('/history') > -1)
      uri = location.pathname.split('/history')[0] + '/'
    else if(location.pathname.indexOf('/mappings') > -1)
      uri = location.pathname.split('/mappings')[0] + '/'
    else if(match.params.conceptVersion)
      uri = location.pathname.split('/').slice(0, 8).join('/') + '/';
    else
      return this.getVersionedObjectURLFromPath();

    return uri
  }

  getVersionedObjectURLFromPath() {
    const { location } = this.props;

    return location.pathname.split('/').slice(0, 7).join('/') + '/';
  }

  refreshDataByURL() {
    this.setState({isLoading: true, notFound: false, accessDenied: false, permissionDenied: false}, () => {
      APIService.new()
                .overrideURL(encodeURI(this.getConceptURLFromPath()))
                .get()
                .then(response => {
                  if(get(response, 'detail') === "Not found.")
                    this.setState({isLoading: false, concept: {}, notFound: true, accessDenied: false, permissionDenied: false})
                  else if(get(response, 'detail') === "Authentication credentials were not provided.")
                    this.setState({isLoading: false, notFound: false, concept: {}, accessDenied: true, permissionDenied: false})
                  else if(get(response, 'detail') === "You do not have permission to perform this action.")
                    this.setState({isLoading: false, notFound: false, concept: {}, accessDenied: false, permissionDenied: true})
                  else if(!isObject(response))
                    this.setState({isLoading: false}, () => {throw response})
                  else
                    this.setState({isLoading: false, concept: response.data}, () => {
                      if(this.state.tab === 1)
                        this.getVersions()
                      else
                        this.getMappings()
                    })
                })

    })
  }

  getVersions() {
    APIService.new()
              .overrideURL(encodeURI(this.getVersionedObjectURLFromPath()) + 'versions/')
              .get(null, null, {includeCollectionVersions: true, includeSourceVersions: true})
              .then(response => {
                this.setState({versions: response.data})
              })
  }

  getMappings() {
    this.setState({isLoadingMappings: true}, () => {
      APIService.new()
                .overrideURL(encodeURI(this.getConceptURLFromPath()) + 'mappings/?includeInverseMappings=true&limit=1000')
                .get()
                .then(response => {
                  this.setState({mappings: response.data, isLoadingMappings: false})
                })
    })
  }

  onTabChange = (event, value) => {
    this.setState({tab: value}, () => {
      if(value === 1)
        this.getVersions()
    })
  }

  isVersionedObject() {
    const version = this.props.match.params.conceptVersion;
    if(version)
      return includes(TABS, version)
    return true
  }

  render() {
    const {
      concept, versions, mappings, isLoadingMappings, isLoading, tab,
      notFound, accessDenied, permissionDenied
    } = this.state;
    const currentURL = this.getConceptURLFromPath()
    const isVersionedObject = this.isVersionedObject()
    const hasError = notFound || accessDenied || permissionDenied;
    return (
      <div style={isLoading ? {textAlign: 'center', marginTop: '40px'} : {}}>
        { isLoading && <CircularProgress color='primary' /> }
        { notFound && <NotFound /> }
        { accessDenied && <AccessDenied /> }
        { permissionDenied && <PermissionDenied /> }
        {
          !isLoading && !hasError &&
          <div className='col-md-12 home-container no-side-padding'>
            <ConceptHomeHeader
              concept={concept}
              mappings={mappings}
              isVersionedObject={isVersionedObject}
              versionedObjectURL={this.getVersionedObjectURLFromPath()}
              currentURL={currentURL}
            />
            <ConceptHomeTabs
              tab={tab}
              onChange={this.onTabChange}
              concept={concept}
              versions={versions}
              mappings={mappings}
              isLoadingMappings={isLoadingMappings}
              currentURL={currentURL}
              isVersionedObject={isVersionedObject}
            />
          </div>
        }
      </div>
    )
  }
}

export default ConceptHome;
