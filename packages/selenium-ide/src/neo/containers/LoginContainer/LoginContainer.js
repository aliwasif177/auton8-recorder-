import React, { useEffect, useState } from 'react'
import { Component } from 'react'
import 'react-toastify/dist/ReactToastify.css'
import { ToastContainer, toast } from 'react-toastify'
import Modal from '../../components/Modal'
import FlatButton from '../../components/FlatButton'
import DialogContainer from '../../components/Dialogs/Dialog'
import './style.css'
import { Button, FormControl, TextField } from '@material-ui/core'
import InputLabel from '@material-ui/core/InputLabel'
import Select from '@material-ui/core/Select'
import API from '../../components/Dialogs/service/httpService'
import { authHeader } from '../../components/Dialogs/service/authHeader'
import { TailLoader } from '../loader/loader'

export const LoginContainer = props => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [successLogin, setSuccessLogin] = useState(false)
  const [loading, setLoading] = useState(false)

  const loginUser = async () => {
    setLoading(true)
    let data = {}
    data.data = { email: email, password: password }
    data.path = '/users/login'
    const response = await API.post(data)
      .then(res => {
        setLoading(false)
        localStorage.setItem('token', res.data.payload.token)
        localStorage.setItem('email', res.data.payload.email)
        toast.success('Successfully loged in')

        setSuccessLogin(true)
        props.getAllGroups()
        props.handleLoginModal(false)
      })
      .catch(err => {
        setLoading(false)
        toast.error('Login failed')
        localStorage.clear()
        props.handleLoginModal(false)
        setSuccessLogin(false)
      })
  }

  return (
    <Modal
      className="stripped language-selector"
      isOpen={!successLogin}
      modalTitle={'Login'}
      modalDescription={'Enter credentials to  login'}
    >
      <DialogContainer
        title="Login"
        buttons={[
          <FlatButton
            disabled={
              !(email.trim('').length && password.trim('').length) || loading
            }
            key="ok"
            type="submit"
            onClick={() => {
              loginUser()
            }}
          >
            Login
          </FlatButton>,
        ]}
        modalTitle={'Login'}
        modalDescription={'Login modal'}
      >
        {loading ? (
          <div className="text-center m-auto">
            <TailLoader height={100} width={100} />
          </div>
        ) : (
          <div style={{ padding: '15px' }}>
            <TextField
              value={email}
              style={{ marginTop: '20px' }}
              className="my-3 labelled-input"
              id="outlined-basic-email"
              label="Email"
              variant="outlined"
              type="email"
              onChange={e => setEmail(e.target.value)}
            />
            <TextField
              value={password}
              style={{ marginTop: '20px' }}
              className="my-3 labelled-input"
              id="outlined-basic-password"
              label="Password"
              variant="outlined"
              type="password"
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        )}
      </DialogContainer>
    </Modal>
  )
}
