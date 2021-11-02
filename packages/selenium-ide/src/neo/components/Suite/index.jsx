// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import React from 'react'
import PropTypes from 'prop-types'
import { DropTarget } from 'react-dnd'
import classNames from 'classnames'
import { observer } from 'mobx-react'
import { modifier } from 'modifier-keys'
import TestList from '../TestList'
import { Type } from '../Test'
import UiState from '../../stores/view/UiState'
import PlaybackState from '../../stores/view/PlaybackState'
import { withOnContextMenu } from '../ContextMenu'
import ListMenu, { ListMenuItem } from '../ListMenu'
import MoreButton from '../ActionButtons/More'
import './style.css'
import { authHeader } from '../Dialogs/service/authHeader'
import API from '../../../../src/neo/components/Dialogs/service/httpService'

const testTarget = {
  canDrop(props, monitor) {
    const test = monitor.getItem().test
    return !props.suite.containsTest(test)
  },
  hover(props, monitor) {
    // check if they are different suites
    const dragged = monitor.getItem()
    if (monitor.canDrop() && props.suite !== dragged.suite) {
      dragged.suite.removeTestCase(dragged.test)
      props.suite.insertTestCaseAt(dragged.test, 0)
      dragged.suite = props.suite
      dragged.index = 0
      return
    }
  },
}

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
  }
}

@observer
class Suite extends React.Component {
  constructor(props) {
    super(props)
    this.store = UiState.getSuiteState(props.suite)
    this.handleClick = this.handleClick.bind(this)
  }
  static propTypes = {
    suite: PropTypes.object.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    selectTests: PropTypes.func.isRequired,
    rename: PropTypes.func.isRequired,
    editSettings: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    isOver: PropTypes.bool,
    canDrop: PropTypes.bool,
    onContextMenu: PropTypes.func,
    setContextMenu: PropTypes.func,
    codeExport: PropTypes.func,
  }

  getAllTestCase = async id => {
    let groupTestcaseInitialData = {}
    groupTestcaseInitialData.path = `/groups/${id}/testcases`
    groupTestcaseInitialData.csrf = authHeader()
    API.fetch(groupTestcaseInitialData)
      .then(res => {
        let testcases = []
        res.data.payload.map((testCase, index) => {
          testcases[index] = UiState._project.createTestCase(
            testCase.testName,
            testCase.testCaseId,
            testCase.emailAddressListId,
            testCase.smsAlertListId,
            'www.google.com'
          )
          this.props.suite.addTestCase(testcases[index])
        })
      })
      .catch(err => {
        console.log(err)
        // if(err){

        //   toast.error(err.response.data.errors.message)
        // }
        // this.setState({
        //   loading: false,
        // })
      })
  }

  handleClick = suit => {
    console.log(this.props.suite)

    console.log(UiState)
    console.log(suit)

    this.props.suite.setOpen(!this.props.suite.isOpen)
    if (this.props.suite.isOpen) {
      this.getAllTestCase(this.props.suite.groupTestId)
    }
  }
  handleKeyDown(event) {
    const e = event.nativeEvent
    modifier(e)
    const noModifiers = !e.primaryKey && !e.secondaryKey

    if (noModifiers && e.key === 'ArrowLeft') {
      event.preventDefault()
      event.stopPropagation()
      this.props.suite.setOpen(false)
      UiState.selectTestByIndex(-1, this.props.suite)
    }
  }
  render() {
    const listMenu = (
      <ListMenu
        width={130}
        padding={-5}
        opener={<MoreButton aria-label="More options" canFocus={true} />}
      >
        <ListMenuItem onClick={this.props.selectTests}>Add tests</ListMenuItem>
        <ListMenuItem
          onClick={() =>
            this.props.rename(this.props.suite.name).then(name => {
              this.props.suite.setName(name)
            })
          }
        >
          Rename
        </ListMenuItem>
        <ListMenuItem onClick={this.props.remove}>Delete</ListMenuItem>
        <ListMenuItem onClick={this.props.editSettings}>Settings</ListMenuItem>
        <ListMenuItem onClick={this.props.codeExport}>Export</ListMenuItem>
      </ListMenu>
    )
    //setting component of context menu.
    this.props.setContextMenu(listMenu)

    return (
      <div onKeyDown={this.handleKeyDown.bind(this)}>
        <div className="project" onContextMenu={this.props.onContextMenu}>
          {this.props.connectDropTarget(
            <a
              href="#"
              tabIndex="-1"
              className={classNames(
                PlaybackState.suiteState.get(this.props.suite.id),
                { active: this.props.suite.isOpen }
              )}
              onClick={suit => this.handleClick(suit)}
            >
              <span className="si-caret" />
              <span
                className={classNames('title', {
                  changed: this.props.suite.modified,
                })}
              >
                {this.props.suite.name}
              </span>
            </a>
          )}
          {listMenu}
        </div>
        <TestList
          collapsed={!this.props.suite.isOpen}
          suite={this.props.suite}
          tests={this.store.filteredTests.get()}
          removeTest={test => {
            this.props.suite.removeTestCase(test)
            UiState.selectTest()
          }}
        />
      </div>
    )
  }
}

export default withOnContextMenu(DropTarget(Type, testTarget, collect)(Suite))
