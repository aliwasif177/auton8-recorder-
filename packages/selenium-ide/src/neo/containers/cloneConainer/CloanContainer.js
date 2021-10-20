import React, { useEffect, useState } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer, toast } from 'react-toastify'
import Modal from '../../components/Modal'
import FlatButton from '../../components/FlatButton'
import DialogContainer from '../../components/Dialogs/Dialog'
import './style.css'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import API from '../../components/Dialogs/service/httpService'
import { authHeader } from '../../components/Dialogs/service/authHeader'
import { TailLoader } from '../loader/loader'
import { Button, FormControl, TextField } from '@material-ui/core'
import UiState from '../../stores/view/UiState'

export const CloanContainer = props => {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [testName, setTestName] = useState('')
  const [loading, setLoading] = useState(false)
  const [cloneSuccess, setCloneSucces] = useState(null)
  const [cloneError, setCloneError] = useState(null)

  useEffect(() => {
    getAllGroups()
  }, [])

  const getAllGroups = async () => {
    setLoading(true)
    let data = {
      pageNo: 0,
      pageSize: 20,
      sortBy: '',
      sortDirection: '',
      searchParams: {
        projectName: 'AUTON8',
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
        // setLoading(false)
        setGroups(res.data.payload)
      })
      .catch(err => {
        setLoading(false)
        setGroups([])
      })
  }

  const cloneTestCase = () => {
    setLoading(true)
    let data = {
      siteGroupId: selectedGroup,
      testName: testName,
      testCaseId: UiState.displayedTest.testCaseId,
    }
    let cloneInitialData = {}
    cloneInitialData.data = data
    cloneInitialData.path = '/groups/testcase/clone'
    cloneInitialData.csrf = authHeader()
    API.post(cloneInitialData)
      .then(res => {
        setLoading(false)
        setCloneSucces(res.payload)
        toast.success('test case cloned!')
        props.cloneToggle()
      })
      .catch(err => {
        setLoading(false)
        setCloneSucces(null)
        toast.success(res.response.data.errors)
      })
  }

  return (
    <div>
      <Modal
        className="stripped language-selector"
        isOpen={props.isCloning}
        onRequestClose={props.cloneToggle}
        modalTitle={'Clone'}
        modalDescription={'Clone a test case'}
      >
        <DialogContainer
          title="Clone"
          onRequestClose={props.cloneToggle}
          buttons={[
            <FlatButton
              key="ok"
              type="submit"
              onClick={() => {
                cloneTestCase()
              }}
              disabled={!testName.trim('').length || !selectedGroup}
            >
              Clone
            </FlatButton>,
            <FlatButton
              // disabled={false}

              onClick={() => {
                props.cloneToggle()
              }}
              style={{
                marginRight: '0',
              }}
              key="cancel"
            >
              Cancel
            </FlatButton>,
          ]}
          modalTitle={'Clone'}
          modalDescription={'Clone a test case'}
        >
          {loading ? (
            <div style={{ textAlign: 'center' }}>
              <TailLoader width={100} height={100} />
            </div>
          ) : (
            <>
              <FormControl style={{ display: 'block' }} variant="filled">
                <InputLabel htmlFor="filled-site-native-simple">
                  Group
                </InputLabel>
                <Select
                  style={{
                    margin: '20px',
                    display: 'block',
                    marginTop: '10px',
                  }}
                  native
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  inputProps={{
                    name: 'group',
                    id: 'filled-site-native-simple',
                  }}
                >
                  {groups.length > 0
                    ? groups.map((group, key) => {
                        return (
                          <option key={key} value={group.siteGroupId}>
                            {group.siteGroupName}
                          </option>
                        )
                      })
                    : ''}
                </Select>
              </FormControl>
              <TextField
                value={testName}
                style={{ margin: '30px', display: 'block' }}
                className="my-3 labelled-input"
                id="outlined-basic-testCaseName"
                label="Testcase"
                variant="outlined"
                type="text"
                onChange={e => setTestName(e.target.value)}
              />
            </>
          )}
        </DialogContainer>
      </Modal>
    </div>
  )
}
