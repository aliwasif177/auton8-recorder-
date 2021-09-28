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
import Modal from '../../Modal'
import DialogContainer from '../Dialog'
import FlatButton from '../../FlatButton'

import { availableLanguages } from '../../../code-export'
import ModalState from '../../../stores/view/ModalState'
import UiState from '../../../stores/view/UiState'
import './style.css'
import { Button, FormControl, TextField } from '@material-ui/core'
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import API from '../service/httpService'
import { authHeader } from '../service/authHeader'
import { Commands } from '../../../models/Command'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { TailLoader } from '../../../containers/loader/loader'





export default class ExportDialog extends React.Component {
  static propTypes = {
    // isExporting: PropTypes.bool.isRequired,
    // cancelSelection: PropTypes.func.isRequired,
    // completeSelection: PropTypes.func.isRequired,
  }

  state={
    sites:[],
    groups:[],
    selectedSite:null,
    selectedGroup:null,
    testCaseName:'',
    sucessLogin:false,
    selectedSite:'',
    selectedGroup:'',
    testCaseSuccess:false,
    siteModal:false,
    groupModal:false,
    siteName:'',
    siteUrl:'',
    groupName:'',
    siteCreationSucess:false,
    groupCreationSuccess:false,
    loading:false


  }



  componentDidMount(){
  this.getAllSites()
  }

  handleSiteOpening = () => {
    this.setState({
      siteModal:!this.state.siteModal,
      siteName:'',
      siteUrl:''
    })
  }
  handleGroupOpening = () => {
    this.setState({
      groupModal:!this.state.groupModal,
      groupName:''
    })
  }


  siteNameChangeHandler = (e) =>{
    this.setState({
      siteName:e.target.value
    })
  }

  groupNameChangeHandler = (e) => {
    this.setState({
      groupName:e.target.value
    })
  }

  siteUrlChangeHandler=(e)=>{
    this.setState({
      siteUrl:e.target.value
    })
  }

  createSiteForTest = async() => {
    var testSiteRequest = {
      siteName: this.state.siteName,
      description: "sd",
      siteUrl: this.state.siteUrl,
      siteTimeZone:"africa"
    };

    let siteData = {};
siteData.data = testSiteRequest;
siteData.path = "/sites";
siteData.csrf = authHeader();
const response = await API.post(siteData).then(res=>{
toast.success('Site created')
  this.setState({
    siteCreationSucess:true,
    siteModal:false,
    siteName:'',
    siteUrl:''
  })
}).catch(err=>{
  toast.error('Failed to create site')
  this.setState({
    siteCreationSucess:false,
  siteModal:true})});
  }

  createGroupForTest = async() => {
    var testGroupRequest = {
      "siteId" : 1, 
      "siteGroupName" : "Gul bhai 3shaikh 1",
      "emailAddressListId" : 2,
      "smsAlertListId" : 1
  }

    let groupData = {};
    groupData.data = testGroupRequest;
    groupData.path = "/groups";
    groupData.csrf = authHeader();
const response = await API.post(groupData).then(res=>{
toast.success('Group created')
  this.setState({
    siteCreationSucess:true,
    siteModal:false,
    siteName:'',
    siteUrl:'',
    groupName:'',
    groupModal:false
  })
}).catch(err=>{
  toast.error('Failed to create Group')
  this.setState({
    groupCreationSuccess:false,
  groupModal:true})});
  }


  getAllSites = async() =>{

    this.setState({
      loading:true
    })
    const data = {
      pageNo: 0,
      pageSize: 20,
      sortBy: "",
      sortDirection: "",
      searchParams: { siteName: "" },
    };
    let siteData = {};
siteData.data = data;
siteData.path = "/sites/paginated";
siteData.csrf = authHeader();
const response = await API.post(siteData).then(res=>{
  this.setState({
    sites:res.data.payload,
    loading:false
  })
}).catch(err=>{
  this.setState({
    sites:[],
  loading:false})});
}

  getAllGroups = async() => {
    let data= {
      "pageNo": 0,
      "pageSize": 20,
      "sortBy": "",
      "sortDirection": "",
      "searchParams": {
          "projectName": "undefinedsms:undefined",
          "testCaseName": "",
          "emailList": "",
          "smsListName": ""
      }
  }
   
    let groupInitialData = {};
    groupInitialData.data={data}
    groupInitialData.path = "/groups/paginated";
    groupInitialData.csrf = authHeader();
    const response = await API.post(groupInitialData).then(res=>{
      this.setState({
        groups:res.data.payload
      })
    }).catch(err=>{
      this.setState({
        groups:[]
      })
    });
  }

  handleSiteSelection = (e) =>{
    this.setState({
      selectedSite:e.target.value
    },()=>{
      this.getAllGroups()
    })
  }

  handleGroupSelection = (e) =>{
    this.setState({
      selectedGroup:e.target.value
    })
  }

  testcaseChangedHandler = (e) => {
    console.log(e.target.value)
    this.setState({
      testCaseName:e.target.value
    })
  }

  


exportTestcaseToServer = async() => {

  let data={
    testName:'',
    emailAddressListId:'',
    smsAlertListId:''
  }
  console.log(this.state.selectedGroup)
  this.state.groups.map(group=>{
    if(group.siteGroupId ==  this.state.selectedGroup){
      data.testName=this.state.testCaseName;
      data.emailAddressListId=group.emailAddressListId;
      data.smsAlertListId=group.smsAlertListId

    }
  })


  let testcaseData={}
  testcaseData.data = data;
  testcaseData.csrf=authHeader()

  testcaseData.path = '/testcases';
   API.post(testcaseData).then((res)=>{
   this.addTestcaseTogroup(res.data.payload.testCaseId)
        
  
      }).catch((err)=>{
        toast.success('Failed to export test case to server')
        
      });

}


addTestcaseTogroup = (testcaseId) => {


  let testcaseData={}
  testcaseData.csrf=authHeader()

  testcaseData.path = `/groups/${this.state.selectedGroup}/testcases/${testcaseId}`;
      API.post(testcaseData).then((res)=>{
        this.addTeststepstoTestCase(res.data.payload.testCaseId)
      }).catch((err)=>{
        toast.success('Failed to export test case to server')
        
      });



}


addTeststepstoTestCase = async(id) => {
  console.log('my id ' , id)

  UiState.displayedTest.commands.map((command,index)=>{
    console.log(command)
    let params = new FormData();
    let commandTargetValue=command.command+'|'+command.target+'|'+command.value

    params.append("file", null);
    params.append(
      "testCaseStep",
      new Blob(
        [
          JSON.stringify({
            testCaseId: id,
            command: commandTargetValue,
          }),
        ],
        {
          type: "application/json",
        }
      )
    );

    let testStepData = {};
    testStepData.data=params
    testStepData.path = '/testcasesteps';
    testStepData.csrf = authHeader();
    const response =  API.post(testStepData).then((res)=>{
      console.log(res)


        
        if(index+1==UiState.displayedTest.commands.length){
          toast.success('Testcase exported successfully')
        }
        
  
    }).catch((err)=>{
      
    });




    


  })
    
  }







  render() {
    
    // console.log(UiState.pristineCommand)
    // console.log(UiState.displayedTest.commands)
    
    return (
      <>
      {!this.state.siteModal && !this.state.groupModal ? 
      <Modal
        className="stripped language-selector"
        isOpen={this.props.isExporting}
        onRequestClose={this.props.cancelSelection}
        modalTitle={'Export'}
        modalDescription={'Exporting test case to server'}
        
      >
        {/* <ExportContent {...this.props} /> */}
        <SaveTestContent  siteModal={this.state.siteModal}
         groupModal={this.state.groupModal} handleSiteOpening={this.handleSiteOpening}
          handleGroupOpening={this.handleGroupOpening} {...this.props} groups={this.state.groups}
         sites={this.state.sites} getAllGroups={this.getAllGroups}
          getAllSites={this.getAllSites} selectedGroup={this.state.selectedGroup}
           selectedSite={this.state.selectedSite} testCaseName={this.state.testCaseName}
           testcaseChangedHandler={this.testcaseChangedHandler}
           handleGroupSelection={this.handleGroupSelection} handleSiteSelection={this.handleSiteSelection}
           exportTestcaseToServer={this.exportTestcaseToServer}
           loading={this.state.loading}
           />
      </Modal>
      
      :this.state.siteModal? <Modal
      className="stripped language-selector"
      isOpen={this.props.isExporting}
      onRequestClose={this.props.cancelSelection}
      modalTitle={ExportContent.modalTitleElement}
      modalDescription={ExportContent.modalDescriptionElement}
    >
      <CreateSiteModal
       {...this.props} siteUrlChangeHandler={this.siteUrlChangeHandler}
       siteNameChangeHandler={this.siteNameChangeHandler}
       createSiteForTest={this.createSiteForTest}
       handleGroupOpening={this.handleGroupOpening} handleSiteOpening={this.handleSiteOpening}
         />
    </Modal>
      :this.state.groupModal? <Modal
      className="stripped language-selector"
      isOpen={this.props.isExporting}
      onRequestClose={this.props.cancelSelection}
      modalTitle={ExportContent.modalTitleElement}
      modalDescription={ExportContent.modalDescriptionElement}
    >
      <CreateGroupModal
       {...this.props} groupNameChangeHandler={this.groupNameChangeHandler}
       createGroupForTest={this.createGroupForTest}
       handleSiteSelection={this.handleSiteSelection}
       selectedSite={this.state.selectedSite}
       handleGroupOpening={this.handleGroupOpening} handleSiteOpening={this.handleSiteOpening}
       sites={this.state.sites}
        
         />
    </Modal>:
   null

      }
              <ToastContainer />

      </>

    )
  }
}




class ExportContent extends React.Component {
  static modalTitleElement = 'renameTitle'
  static modalDescriptionElement = 'renameDescription'
  constructor(props) {
    super(props)
    this.state = {
      selectedLanguages: [UiState.selectedExportLanguage],
      enableOriginTracing: false,
      enableGridConfig: UiState.gridConfigEnabled,
      gridConfigUrl: UiState.specifiedRemoteUrl,
    }
  }
  static propTypes = {
    cancelSelection: PropTypes.func.isRequired,
    completeSelection: PropTypes.func.isRequired,
  }
  selectLanguage(_isSelected, language) {
    UiState.selectExportLanguage(language)
    this.setState({ selectedLanguages: [language] })
  }
  toggleOriginTracing() {
    this.setState({ enableOriginTracing: !this.state.enableOriginTracing })
  }
  toggleDescriptionAsComment() {
    this.setState({
      enableDescriptionAsComment: !this.state.enableDescriptionAsComment,
    })
  }
  toggleGridConfig() {
    UiState.toggleGridConfig()
    this.setState({ enableGridConfig: !this.state.enableGridConfig })
  }
  onUrlChange(input) {
    UiState.specifyRemoteUrl(input)
    this.setState({ gridConfigUrl: input })
  }
  render() {
    return (
      
      <DialogContainer
        title="Select language"
        onRequestClose={this.props.cancel}
        
        buttons={[
          <FlatButton onClick={this.props.cancelSelection} key="cancel">
            cancel
          </FlatButton>,
          <FlatButton
            disabled={!this.state.selectedLanguages.length}
            type="submit"
            onClick={() => {
              this.props
                .completeSelection(
                  this.state.selectedLanguages,
                  this.state.enableOriginTracing,
                  {
                    gridUrl: this.state.enableGridConfig
                      ? this.state.gridConfigUrl
                      : undefined,
                  },
                  this.state.enableDescriptionAsComment
                )
                .catch(error => {
                  this.props.cancelSelection()
                  ModalState.showAlert({
                    title: 'Unable to complete code export',
                    description: error.message,
                    confirmLabel: 'OK',
                  })
                })
            }}
            style={{
              marginRight: '0',
            }}
            key="ok"
          >
            export
          </FlatButton>,
        ]}
        modalTitle={ExportContent.modalTitleElement}
        modalDescription={ExportContent.modalDescriptionElement}
      >
        <ExportList
          selectedLanguages={this.state.selectedLanguages}
          selectLanguage={this.selectLanguage.bind(this)}
        />
        
        {this.state.enableGridConfig ? (
          <Input
            id="grid-url"
            name="grid-url"
            label="Remote URL"
            
            value={this.state.gridConfigUrl}
            onChange={value => {
              this.onUrlChange(value)
            }}
          />
        ) : (
          undefined
        )}
      </DialogContainer>
    )
  }
}


  
//create site modal

class CreateSiteModal extends React.Component {


  render() {
    return (
      
      <DialogContainer
        title="Login"
        onRequestClose={this.props.cancel}
        
        buttons={[
          <FlatButton  key="ok" type='submit' onClick={() => {
            this.props.createSiteForTest()
          }}>
            Save
          </FlatButton>,
          <FlatButton
            // disabled={false}
            
            onClick={()=>{this.props.cancelSelection();
            this.props.handleSiteOpening();
          this.props.handleGroupOpening()}}
            style={{
              marginRight: '0',
            }}
            key="cancel"
          >
            Cancel
          </FlatButton>,
        ]}
        modalTitle={'Create Site'}
        modalDescription={'Create site for test cases'}
      >
        <div style={{padding:'15px'}}>
      <TextField value={this.props.siteName} style={{marginTop:'20px'}} className='my-3 labelled-input' id="outlined-basic-siteName" label="Site Name" variant="outlined" type='text' onChange={(e)=>this.props.siteNameChangeHandler(e)} />
      <TextField value={this.props.siteUrl} style={{marginTop:'20px'}} className='my-3 labelled-input' id="outlined-basic-siteUrl" label="Site Url" variant="outlined" type='text' onChange={(e)=>this.props.siteUrlChangeHandler(e)} />
      </div>
      </DialogContainer>
    )
  }
}











//login modal


class CreateGroupModal extends React.Component {
  


  render() {
    return (
      
      <DialogContainer
        title="Login"
        onRequestClose={this.props.cancel}
        
        buttons={[
          <FlatButton  key="ok" type='submit' onClick={() => {
            this.props.createGroupForTest()
          }}>
            Save
          </FlatButton>,
          <FlatButton
            // disabled={false}
            
            onClick={()=>{this.props.cancelSelection();
              this.props.handleSiteOpening();
            this.props.handleGroupOpening()}}
            style={{
              marginRight: '0',
            }}
            key="cancel"
          >
            Cancel
          </FlatButton>,
        ]}
        modalTitle={'Create Group'}
        modalDescription={'Create Group for test cases'}
      >
        <div style={{padding:'15px'}}>
        <FormControl style={{display:'block'}} variant="filled" >
        <InputLabel htmlFor="filled-site-native-simple">Site</InputLabel>
        <Select
        style={{margin:'20px',display:'block'}}
          native
          value={this.props.selectedSite}
          onChange={(e)=>this.props.handleSiteSelection(e)}
          inputProps={{
            name: 'site',
            id: 'filled-site-native-simple',
          }}
        >
          {this.props.sites.length>0 ?  this.props.sites.map((site,key)=>{
            
            return(
              <option key={key} value={site.siteId}>{site.siteName}</option>
            )
          }):''}
        </Select>
      </FormControl>
      <TextField value={this.props.groupName} style={{marginTop:'20px'}} className='my-3 labelled-input' id="outlined-basic-group" label="Test Group Name" variant="outlined" type='text' onChange={(e)=>this.props.groupNameChangeHandler(e)} />
      </div>
      </DialogContainer>
    )
  }
}






//login modal


export class SaveTestContent extends React.Component {
  static modalTitleElement = 'renameTitle'
  static modalDescriptionElement = 'renameDescription'
 


  render() {
    return (
      
      <DialogContainer
        title="Export"
        onRequestClose={this.props.cancel}
        
        buttons={[
          <FlatButton  key="ok" type='submit' onClick={
            this.props.exportTestcaseToServer}>
            Export
          </FlatButton>,
          <FlatButton
            // disabled={!(this.props.email.trim('').length&&this.props.password.trim('').length)}
            disabled={false}

            
            onClick={this.props.cancelSelection}
            style={{
              marginRight: '0',
            }}
            key="cancel"
          >
            Cancel
          </FlatButton>,
        ]}
        modalTitle={'Export'}
        modalDescription={'Export testcase and teststeps Modal'}
      >
        {this.props.loading ? 
      <div className='text-center m-auto'>

        <TailLoader height={100} width={100}/>
      </div>
      :
      <div>



<span style={{marginTop:'20px',marginBottom:'10px',paddingLeft:'20px'}}>Dont have site?<a onClick={this.props.handleSiteOpening} href="javascript:void(0);" style={{fontWeight:'bold',cursor:'pointer',textDecoration:'none'}}> Create</a> </span>
        <FormControl style={{display:'block'}} variant="filled" >
        <InputLabel htmlFor="filled-site-native-simple">Site</InputLabel>
        <Select
        style={{margin:'20px',display:'block',marginTop:'10px'}}
          native
          value={this.props.selectedSite}
          onChange={(e)=>this.props.handleSiteSelection(e)}
          inputProps={{
            name: 'site',
            id: 'filled-site-native-simple',
          }}
        >
          {this.props.sites.length>0 ?  this.props.sites.map((site,key)=>{
            return(
              <option key={key} value={site.siteId}>{site.siteName}</option>
            )
          }):''}
        </Select>
      </FormControl>
      <span style={{marginTop:'20px',marginBottom:'10px',paddingLeft:'20px'}}>Dont have Group?<a onClick={this.props.handleGroupOpening} href="javascript:void(0);" style={{fontWeight:'bold',cursor:'pointer',textDecoration:'none'}}> Create</a> </span>
        <FormControl style={{display:'block'}} variant="filled">
        <InputLabel htmlFor="filled-group-native-simple">Group</InputLabel>
        <Select
        className='ms-1 me-2'
        style={{margin:'20px',display:'block',marginTop:'10px'}}
        
          native
          value={this.props.selectedGroup}
          onChange={this.props.handleGroupSelection}
          inputProps={{
            name: 'age',
            id: 'filled-group-native-simple',
          }}
        >
          {this.props.groups.length>0 ?  this.props.groups.map((group,key)=>{
            
            return(
              
              <option key={key} value={group.siteGroupId}>{group.siteGroupName}</option>
            )
          }):''}
        </Select>
      </FormControl>

      <TextField value={this.props.testCaseName} style={{margin:'30px',display:'block'}} className='my-3 labelled-input' id="outlined-basic-testCaseName" label="Testcase" variant="outlined" type='text' onChange={(e)=>this.props.testcaseChangedHandler(e)} />
      </div>

      }

      
      
      </DialogContainer>
    )
  }
}





class ExportList extends React.Component {
  static propTypes = {
    selectedLanguages: PropTypes.array.isRequired,
    selectLanguage: PropTypes.func.isRequired,
  }


  handleChange(language, e) {
    this.props.selectLanguage(e.target.checked, language)
  }

  render() {
    const languages = availableLanguages()
    return (
      <ul className="languages">
         {Object.keys(languages)
          .sort()
          .map(language => (
            <li key={language} className="language">
              <input
                type="radio"
                value={language}
                id={language}
                checked={this.props.selectedLanguages.includes(language)}
                onChange={this.handleChange.bind(this, language)}
              />
              <label htmlFor={language}>
                {languages[language].displayName}
              </label>
            </li>
          ))

         }
        
        
      </ul>
    )
  }
}
