import React from 'react';
import moment from 'moment';
import alertifyjs from 'alertifyjs';
import './Tasks.scss';
import { ExpandMore as ExpandIcon } from '@material-ui/icons';
import {
  Accordion, AccordionDetails, AccordionSummary, Tooltip, Divider, Button, Chip,
} from '@material-ui/core';
import { get, includes, last } from 'lodash';
import { formatDateTime } from '../../common/utils';
import { ERROR_RED, GREEN, WHITE } from '../../common/constants';
import TaskIcon from './TaskIcon';

const ExpiredResult = () => (
  <Chip variant='outlined' label='Result Expired' style={{border: `1px solid ${ERROR_RED}`, color: ERROR_RED}} size='small' />
);

const TASK_RESULT_EXPIRY_HOURS = 72;

const Task = ({task, open, onOpen, onClose, onRevoke, onDownload}) => {
  const { details, state, result } = task
  const status = state.toLowerCase()
  const id = task.task
  const hasResultExpired = status === 'success' && moment.duration(moment(new Date()).diff(moment(task.details.started * 1000))).asHours() > TASK_RESULT_EXPIRY_HOURS;
  const onChange = () => open ? onClose() : onOpen(id)
  const getTemplate = (label, value, type) => {
    let formattedValue = value
    if(type === 'timestamp' && value)
      formattedValue = formatDateTime(value*1000)

    return (
      <React.Fragment>
        <div className='col-md-3 no-left-padding' style={{margin: '5px 0'}}>
          {label}:
        </div>
        <div className='col-md-9 no-right-padding' style={{margin: '5px 0', overflow: 'auto'}}>
          {formattedValue || ' - '}
        </div>
        <Divider style={{width: '100%'}}/>
      </React.Fragment>
    )
  }

  const onCancelTaskClick = event => {
    event.stopPropagation()
    event.preventDefault()

    alertifyjs.confirm(
      `Revoke Task: ${id}`,
      'Stopping a running task may result in a confusing state of content. This action is not reversible. Are you sure you want to cancel this?',
      () => onRevoke(id),
      () => {}
    )

    return false
  }

  const onDownloadTaskClick = event => {
    event.stopPropagation()
    event.preventDefault()
    onDownload(id)
    return false
  }

  return (
    <Accordion expanded={open} onChange={onChange}>
      <AccordionSummary expandIcon={<ExpandIcon />} id={id} className={status}>
        <Tooltip arrow title={state}>
          <div className='col-md-12 no-side-padding task-summary flex-vertical-center'>
            <div className='col-md-1 no-left-padding'>
              <TaskIcon status={status} />
            </div>
            <div className='col-md-11 no-side-padding'>
              <div className='col-md-12 no-side-padding'><b>{id}</b></div>
              <div className='col-md-12 no-side-padding flex-vertical-center'>
                <div className='col-md-8 no-left-padding'>
                  <div className='col-md-12 no-side-padding sub-text italic'>
                    Received: <b>{formatDateTime(details.received * 1000)}</b>
                  </div>
                  <div className='col-md-12 no-side-padding sub-text italic'>
                    Queue: <b>{last(task.task.split('~'))}</b>
                  </div>
                </div>
                <div className='col-md-4 no-side-padding'>
                  {
                    includes(['started', 'received'], status) &&
                    <Button
                      size='small'
                      variant='contained'
                      onClick={onCancelTaskClick}
                      style={{backgroundColor: ERROR_RED, color: WHITE, padding: '0 5px', fontSize: '0.7125rem', marginLeft: '10px', marginTop: '3px'}}
                      >
                      Cancel
                    </Button>
                  }
                  {
                    status === 'success' && !hasResultExpired &&
                    <Button
                      size='small'
                      variant='contained'
                      onClick={onDownloadTaskClick}
                      style={{backgroundColor: GREEN, color: WHITE, padding: '0 5px', fontSize: '0.7125rem', marginLeft: '10px', marginTop: '3px'}}
                      >
                      Download Report
                    </Button>
                  }
                  {
                    hasResultExpired &&
                    <ExpiredResult />
                  }
                </div>
              </div>
              {
                get(result, 'summary') &&
                <div className='col-md-12 no-side-padding sub-text italic'>
                  { result.summary }
                </div>
              }
            </div>
          </div>
        </Tooltip>
      </AccordionSummary>
      <AccordionDetails>
        <div className='col-md-12 no-side-padding'>
          { getTemplate('Task ID', id) }
          { getTemplate('Name', details.name) }
          { getTemplate('Received', details.received, 'timestamp') }
          { getTemplate('Started', details.started, 'timestamp') }
          { details.runtime && getTemplate('Runtime', `${details.runtime} secs`) }
          { details.failed && getTemplate('Failed', details.failed, 'timestamp') }
          { getTemplate('Retries', details.retries) }
          { details.revoked && getTemplate('Revoked', details.revoked, 'timestamp') }
          { details.exception && getTemplate('Exception', details.exception) }
          { status === 'success' && getTemplate('Result', details.result) }
          { details.args && getTemplate('Args', details.args) }
        </div>
      </AccordionDetails>
    </Accordion>
  )
}

export default Task;
