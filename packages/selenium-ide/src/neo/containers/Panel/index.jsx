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

import browser from 'webextension-polyfill'
import React from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import SplitPane from 'react-split-pane'
import classNames from 'classnames'
import { modifier } from 'modifier-keys'
import Tooltip from '../../components/Tooltip'
import storage from '../../IO/storage'
import ProjectStore from '../../stores/domain/ProjectStore'
import seed from '../../stores/seed'
import SuiteDropzone from '../../components/SuiteDropzone'
import PauseBanner from '../../components/PauseBanner'
import ProjectHeader from '../../components/ProjectHeader'
import Navigation from '../Navigation'
import Editor from '../Editor'
import Console from '../Console'
import Modal from '../Modal'
import UiState from '../../stores/view/UiState'
import PlaybackState from '../../stores/view/PlaybackState'
import ModalState from '../../stores/view/ModalState'
import API from '../../../../src/neo/components/Dialogs/service/httpService'
import '../../side-effects/contextMenu'
import '../../styles/app.css'
import '../../styles/font.css'
import '../../styles/layout.css'
import '../../styles/resizer.css'
import { isProduction, isTest, userAgent } from '../../../common/utils'
import Logger from '../../stores/view/Logs'

import { loadProject, saveProject, loadJSProject } from '../../IO/filesystem'
import { authHeader } from '../../components/Dialogs/service/authHeader'
import axios from 'axios'
import ExportDialog from '../../components/Dialogs/Export/index'
import { LoginContainer } from '../LoginContainer/LoginContainer'
import { CloanContainer } from '../cloneConainer/CloanContainer'
import { toast } from 'react-toastify'
import { TailLoader } from '../loader/loader'

if (!isTest) {
  const api = require('../../../api')
  browser.runtime.onMessage.addListener(api.default)
}

if (userAgent.os.name === 'Windows') {
  require('../../styles/conditional/scrollbar.css')
  require('../../styles/conditional/text.css')
}

const project = observable(new ProjectStore(''))

UiState.setProject(project)

if (isProduction) {
  // createDefaultSuite(project, { suite: '', test: '' })
} else {
  // seed(project)
}
project.setModified(false)

function createDefaultSuite(
  aProject,
  name = { suite: 'Default Suite', test: 'Untitled' }
) {
  const suite = aProject.createSuite(name.suite)
  const test = aProject.createTestCase(name.test)
  suite.addTestCase(test)
  UiState.selectTest(test)
}

function firefox57WorkaroundForBlankPanel() {
  // TODO: remove this as soon as Mozilla fixes https://bugzilla.mozilla.org/show_bug.cgi?id=1425829
  // browser. windows. create () displays blank windows (panel, popup or detached_panel)
  // The trick to display content is to resize the window...
  // We do not check the browser since this doesn't affect chrome at all

  function getCurrentWindow() {
    return browser.windows.getCurrent()
  }

  getCurrentWindow().then(currentWindow => {
    const updateInfo = {
      width: currentWindow.width,
      height: currentWindow.height + 1, // 1 pixel more than original size...
    }
    browser.windows.update(currentWindow.id, updateInfo)
  })
}

if (browser.windows) {
  firefox57WorkaroundForBlankPanel()
}

@DragDropContext(HTML5Backend)
@observer
export default class Panel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      project,
      saveButton: false,
      modalOpen: false,
      shouldLogin: false,
      isCloaning: false,
      isUpdating: false,
      loading: false,
    }
    this.parseKeyDown = this.parseKeyDown.bind(this)
    this.keyDownHandler = window.document.body.onkeydown = this.handleKeyDown.bind(
      this
    )
    if (isProduction) {
      // the handler writes the size to the extension storage, which throws in development
      this.resizeHandler = window.addEventListener(
        'resize',
        this.handleResize.bind(this, window)
      )
      this.quitHandler = window.addEventListener('beforeunload', e => {
        if (project.modified) {
          const confirmationMessage =
            'You have some unsaved changes, are you sure you want to leave?'

          e.returnValue = confirmationMessage
          return confirmationMessage
        }
      })
      this.moveInterval = setInterval(() => {
        storage.set({
          origin: {
            top: window.screenY,
            left: window.screenX,
          },
        })
      }, 3000)
    }
  }
  handleResize(currWindow) {
    UiState.setWindowHeight(currWindow.innerHeight)
    storage.set({
      size: {
        height: currWindow.outerHeight,
        width: currWindow.outerWidth,
      },
    })
  }
  parseKeyDown(e) {
    modifier(e)
    return {
      key: e.key.toUpperCase(),
      primaryAndShift: e.primaryKey && e.shiftKey,
      onlyPrimary: e.primaryKey && !e.secondaryKey,
      noModifiers: !e.primaryKey && !e.secondaryKey,
    }
  }
  handleKeyDown(e) {
    // We want to enable disabling these Key Combinations for Accessibility
    if (!UiState.keyboardShortcutsEnabled) {
      e.preventDefault()
      return
    }

    const keyComb = this.parseKeyDown(e)
    // when editing these, remember to edit the button's tooltip as well
    if (keyComb.primaryAndShift && keyComb.key === 'N') {
      e.preventDefault()
      this.loadNewProject()
    } else if (keyComb.onlyPrimary && keyComb.key === 'N') {
      e.preventDefault()
    } else if (keyComb.onlyPrimary && keyComb.key === 'S') {
      e.preventDefault()
      saveProject(this.state.project)
    } else if (keyComb.onlyPrimary && keyComb.key === 'O' && this.openFile) {
      e.preventDefault()
      this.openFile()
    } else if (keyComb.onlyPrimary && keyComb.key === '1') {
      // test view
      e.preventDefault()
      UiState.changeView(UiState.views[+keyComb.key - 1])
    } else if (keyComb.onlyPrimary && keyComb.key === '2') {
      // suite view
      e.preventDefault()
      UiState.changeView(UiState.views[+keyComb.key - 1])
    } else if (keyComb.onlyPrimary && keyComb.key === '3') {
      // execution view
      e.preventDefault()
      UiState.changeView(UiState.views[+keyComb.key - 1])
    } else if (keyComb.primaryAndShift && e.code === 'KeyR' && isProduction) {
      // run suite
      e.preventDefault()
      if (PlaybackState.canPlaySuite) {
        PlaybackState.playSuiteOrResume()
      }
    } else if (keyComb.onlyPrimary && keyComb.key === 'R' && isProduction) {
      // run test
      e.preventDefault()
      if (!PlaybackState.isPlayingSuite) {
        PlaybackState.playTestOrResume()
      }
    } else if (keyComb.onlyPrimary && keyComb.key === 'P') {
      // pause
      e.preventDefault()
      PlaybackState.pauseOrResume()
    } else if (keyComb.onlyPrimary && keyComb.key === '.') {
      // stop
      e.preventDefault()
      PlaybackState.abortPlaying()
    } else if (keyComb.onlyPrimary && keyComb.key === "'") {
      // step over
      e.preventDefault()
      PlaybackState.stepOver()
    } else if (keyComb.onlyPrimary && keyComb.key === 'Y') {
      // disable breakpoints
      e.preventDefault()
      PlaybackState.toggleDisableBreakpoints()
    } else if (keyComb.onlyPrimary && keyComb.key === 'U') {
      // record
      e.preventDefault()
      if (!PlaybackState.isPlaying) {
        UiState.toggleRecord()
      }
    }
  }
  handleKeyDownAlt(e) {
    // The escape key is used in internal dialog modals to cancel. But the key
    // bubbles to the body event listener in Panel's ctor. Moving the event
    // listener into the top-level div in render prevents the keys from being
    // recognized unless an internal component has focus (e.g., selecting a test,
    // a test command, or an element within the command form).
    //
    // To fix, separating the key handling into two functions. One with just escape
    // that will live on the top-level div. The other with the remaining keys that
    // will live in an event listener on document.body.
    const key = this.parseKeyDown(e)
    if (key.noModifiers && key.key === 'ESCAPE') {
      UiState.toggleConsole()
    }
  }

  componentDidMount() {
    localStorage.getItem('token')
      ? this.getAllGroups()
      : this.setState({ shouldLogin: true })
  }

  async loadNewProject() {
    if (!UiState.isSaved()) {
      const choseProceed = await ModalState.showAlert({
        title: 'Create without saving',
        description:
          'Are you sure you would like to create a new project without saving the current one?',
        confirmLabel: 'proceed',
        cancelLabel: 'cancel',
      })
      if (choseProceed) {
        await UiState.stopRecording({ nameNewTest: false })
        this.createNewProject()
      }
    } else if (UiState.isRecording) {
      const choseProceed = await ModalState.showAlert({
        title: 'Stop recording',
        description:
          'Leaving this project and creating a new one will stop the recording process. Would you like to continue?',
        confirmLabel: 'proceed',
        cancelLabel: 'cancel',
      })
      if (choseProceed) {
        await UiState.stopRecording({ nameNewTest: false })
        this.createNewProject()
      }
    } else {
      this.createNewProject()
    }
  }
  async createNewProject() {
    const name = await ModalState.renameProject()
    const newProject = observable(new ProjectStore(name))
    createDefaultSuite(newProject)
    // loadJSProject(this.state.project, newProject.toJS())
    Logger.clearLogs()
    newProject.setModified(false)
  }

  getAllGroups = async () => {
    this.setState({
      loading: true,
    })
    let data = {
      pageNo: 0,
      pageSize: 200,
      sortBy: '',
      sortDirection: '',
      searchParams: {
        projectName: 'undefinedsms:undefined',
        testCaseName: '',
        emailList: '',
        smsListName: '',
      },
    }

    let groupInitialData = {}
    groupInitialData.data = { data }
    groupInitialData.path = '/groups/paginated'
    groupInitialData.csrf = authHeader()
    API.post(groupInitialData)
      .then(res => {
        let newProject = null
        let suites = []
        let testCase = []
        newProject = observable(new ProjectStore('Auton8'))
        res.data.payload.map((data, index) => {
          suites[index] = newProject.createSuite(
            data.siteGroupName,
            data.siteGroupId
          )
          loadJSProject(this.state.project, newProject.toJS())
          this.setState({
            loading: false,
          })

          // API.fetch(groupTestcaseInitialData)
          //   .then(res => {
          //     res.data.payload.map((data, testCaseIndex) => {
          //       testCase[nextIndex] = newProject.createTestCase(
          //         data.testName,
          //         data.testCaseId,
          //         data.emailAddressListId,
          //         data.smsAlertListId,
          //         'www.google.com'
          //       )

          //       suites[nextIndex].addTestCase(testCase[nextIndex])
          //       let testCaseStepsData = {}
          //       testCaseStepsData.path = `/testcases/${
          //         data.testCaseId
          //       }/testcasesteps`
          //       testCaseStepsData.csrf = authHeader()
          //       let testCaseRes = res.data.paload
          //       API.fetch(testCaseStepsData)
          //         .then(res => {
          //           let testcaseIndexForStep = testCaseIndex
          //           res.data.payload.map((step, stepIndex) => {
          //             let stepSplits = step.command.split('|')
          //             testCase[nextIndex].createCommand(
          //               undefined,
          //               stepSplits[0],
          //               stepSplits[1],
          //               stepSplits[2]
          //             )
          //             loadJSProject(this.state.project, newProject.toJS())
          //             if (
          //               testcaseIndexForStep + 1 == testCaseRes.length &&
          //               stepIndex + 1 == res.data.payload.length
          //             ) {
          //               this.setState({
          //                 loading: false,
          //               })
          //             }
          //           })
          //         })
          //         .catch(err => {
          //           this.setState({
          //             loading: false,
          //           })
          //         })
          //     })
          //   })
          // .catch(err => {
          //   console.log(err)
          //   this.setState({
          //     loading: false,
          //   })
          // })
        })
      })
      .catch(err => {
        console.log(err)
        this.setState({
          loading: false,
        })
      })
  }

  handleLoginModal = bool => {
    this.setState({
      shouldLogin: bool,
    })
  }

  async doLoadProject(file) {
    if (!UiState.isSaved()) {
      const choseProceed = await ModalState.showAlert({
        title: 'Load without saving',
        description:
          'Are you sure you would like to load a new project without saving the current one?',
        confirmLabel: 'proceed',
        cancelLabel: 'cancel',
      })
      if (choseProceed) {
        await UiState.stopRecording({ nameNewTest: false })
        loadProject(this.state.project, file)
      }
    } else if (UiState.isRecording) {
      const choseProceed = await ModalState.showAlert({
        title: 'Stop recording',
        description:
          'Leaving this project and loading a new one will stop the recording process. Would you like to continue?',
        confirmLabel: 'proceed',
        cancelLabel: 'cancel',
      })
      if (choseProceed) {
        await UiState.stopRecording({ nameNewTest: false })
        loadProject(this.state.project, file)
      }
    } else {
      loadProject(this.state.project, file)
    }
  }

  componentWillUnmount() {
    if (isProduction) {
      clearInterval(this.moveInterval)
      window.removeEventListener('resize', this.resizeHandler)
      window.removeEventListener('beforeunload', this.quitHandler)
    }
  }
  save = () => {
    this.setState({
      saveButton: !this.state.saveButton,
      modalOpen: !this.state.modalOpen,
    })
  }

  addTeststepstoTestCase = async id => {
    console.log('my id ', id)

    UiState.displayedTest.commands.map(command => {
      console.log(command)
      let params = new FormData()
      let commandTargetValue =
        command.command + '|' + command.target + '|' + command.value

      params.append('file', null)
      params.append(
        'testCaseStep',
        new Blob(
          [
            JSON.stringify({
              testCaseId: id,
              command: commandTargetValue,
            }),
          ],
          {
            type: 'application/json',
          }
        )
      )

      let testStepData = {}
      testStepData.data = params
      testStepData.path = '/testcasesteps'
      testStepData.csrf = authHeader()
      const response = API.post(testStepData)
        .then(res => {
          console.log(res)
        })
        .catch(err => {
          this.setState({
            loading: false,
          })
          // if(err) {
          //   toast.error(err.response.data.errors.message)

          // }
        })
    })
  }

  cloneTestCase = () => {
    console.log(UiState.displayedTest)
    this.setState({
      isCloaning: true,
    })
    console.log(this.state.project)
  }

  cloneToggle = () => {
    this.setState({
      isCloaning: !this.state.isCloaning,
    })
  }

  updateTestCase = () => {
    console.log(UiState.displayedTest)
    let data = {
      pageNo: 0,
      pageSize: 200,
      sortBy: '',
      sortDirection: '',
      searchParams: {
        projectName: 'undefinedsms:undefined',
        testCaseName: '',
        emailList: '',
        smsListName: '',
      },
    }

    let updateTestCaseData = {}
    updateTestCaseData.data = { data }
    updateTestCaseData.path = `/testcases/${UiState.displayedTest.testCaseId}`
    updateTestCaseData.csrf = authHeader()
    API.put(updateTestCaseData)
      .then(res => {
        toast.success('Test case updated successfully')
      })
      .catch(err => {
        toast.success('Failed to update test case')
      })
  }

  render() {
    return (
      <div
        className={classNames(
          'container',
          UiState.isBigSpacingEnabled ? 'enable-big-spacing' : ''
        )}
        onKeyDown={this.handleKeyDownAlt.bind(this)}
        style={{
          minHeight: UiState.minContentHeight + UiState.minConsoleHeight + 'px',
          height: '100vh',
        }}
      >
        {localStorage.getItem('token') &&
          this.state.isCloaning && (
            <CloanContainer
              cloneToggle={this.cloneToggle}
              isCloning={this.state.isCloaning}
            />
          )}
        {localStorage.getItem('token') && !this.state.shouldLogin ? (
          <SuiteDropzone loadProject={this.doLoadProject.bind(this)}>
            <SplitPane
              split="horizontal"
              minSize={UiState.windowHeight}
              maxSize={UiState.windowHeight}
              size={UiState.windowHeight}
              onChange={size =>
                UiState.resizeConsole(window.innerHeight - size)
              }
              style={{
                position: 'initial',
                height: '100%',
              }}
            >
              <div className="wrapper">
                {/* //Modal Start */}

                {/* //Modal End */}
                <PauseBanner />
                <ProjectHeader
                  title={this.state.project.name}
                  changed={this.state.project.modified}
                  changeName={this.state.project.changeName}
                  // openFile={openFile => {
                  //   this.openFile = openFile
                  // }}
                  // load={this.doLoadProject.bind(this)}
                  load={this.updateTestCase.bind(this)}
                  save={
                    () => this.save()
                    // saveProject(this.state.project)
                  }
                  new={this.cloneTestCase.bind(this)}
                />
                <div
                  className={classNames('content', {
                    dragging: UiState.navigationDragging,
                  })}
                >
                  {this.state.saveButton && (
                    <ExportDialog
                      isExporting={this.state.modalOpen}
                      cancelSelection={this.save}
                    />
                  )}
                  <SplitPane
                    split="vertical"
                    minSize={UiState.minNavigationWidth}
                    maxSize={UiState.maxNavigationWidth}
                    size={UiState.navigationWidth}
                    onChange={UiState.resizeNavigation}
                  >
                    {this.state.loading && (
                      <div
                        style={{ textAlign: 'center' }}
                        className="mt-5 pt-5"
                      >
                        <TailLoader height={100} width={100} />
                      </div>
                    )}

                    <Navigation
                      tests={UiState.filteredTests}
                      suites={this.state.project.suites}
                      duplicateTest={this.state.project.duplicateTestCase}
                    />

                    <Editor
                      url={this.state.project.url}
                      urls={this.state.project.urls}
                      setUrl={this.state.project.setUrl}
                      test={UiState.displayedTest}
                      callstackIndex={UiState.selectedTest.stack}
                    />
                  </SplitPane>
                </div>
              </div>
              <Console
                height={UiState.consoleHeight}
                restoreSize={UiState.restoreConsoleSize}
              />
            </SplitPane>
            <Modal
              project={this.state.project}
              createNewProject={this.createNewProject.bind(this)}
            />
            <Tooltip />
          </SuiteDropzone>
        ) : (
          <LoginContainer
            getAllGroups={this.getAllGroups}
            handleLoginModal={this.handleLoginModal}
          />
        )}
      </div>
    )
  }
}
