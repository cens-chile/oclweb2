import React from 'react';
import { Tabs, Tab } from '@material-ui/core';
import { map } from 'lodash';
import OrgHomeChildrenList from '../orgs/OrgHomeChildrenList';
import { DEFAULT_LIMIT } from '../../common/constants';


const FhirTabs = ({ tab, onTabChange, selectedConfig, org, location, match, url, limit  , hapi}) => {
  const tabConfigs = selectedConfig.config.tabs;
  const selectedTabConfig = tabConfigs[tab];
  return (
    <div className='col-md-12 sub-tab'>
      <Tabs className='sub-tab-header col-md-8 no-side-padding' value={tab} onChange={onTabChange} aria-label="fhir-home-tabs" classes={{indicator: 'hidden'}}>
        {
          map(tabConfigs, config => <Tab key={config.label} label={config.label} />)
        }
      </Tabs>
      <div className='sub-tab-container' style={{display: 'flex', height: 'auto', width: '100%'}}>
        <OrgHomeChildrenList
          org={org}
          location={location}
          match={match}
          url={url}
          resource={selectedTabConfig.type}
          viewFilters={selectedTabConfig.filters}
          viewFields={selectedTabConfig.fields}
          fixedFilters={{
            limit: selectedTabConfig.page_size || limit || DEFAULT_LIMIT,
            isTable: (selectedTabConfig.layout || '').toLowerCase() !== 'list',
            sortParams: {sortAsc: '_id'}
          }}
          fhirParams={{
            _getpagesoffset: 0,
            _count: limit || DEFAULT_LIMIT,
            _sort: '_id'
          }}
          staticParams={{
            _total: 'accurate',
            _summary: true
          }}
          noQuery
          noHeaders
          nested
          fhir
          hapi={hapi}
        />
      </div>
    </div>
  )
}

export default FhirTabs;
