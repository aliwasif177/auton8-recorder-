import axios from 'axios'

this.API = axios.create({
  baseURL:
    'http://ec2-18-116-115-34.us-east-2.compute.amazonaws.com:7080/api/v1',
})
// Your default config
this.API.interceptors.response.use(
  res => {
    return res
  },
  error => {
    const expectedError =
      error.response.status >= 400 && error.response.status < 500

    if (!expectedError) {
      toast.error('An unexpected error occurrred.')
    }

    if (error.response.status === 400) {
      toast.error('Sign in to continue')
      setTimeout(() => {
        localStorage.removeItem('token')
        window.location = '/login'
      }, 100)
    }

    return Promise.reject(error)
  }
)

const fetch = async ({ path, csrf }) => {
  try {
    let headers = {}
    if (csrf) headers = { ...csrf }
    const res = await this.API.get(path, { headers })
    return res
  } catch (ex) {
    throw ex
  }
}

const post = async ({ path, data, csrf }) => {
  try {
    let headers = {}
    if (csrf) headers = { ...csrf }
    return await this.API.post(path, data, { headers })
  } catch (ex) {
    throw ex
  }
}

const postUser = async ({ path, data, headers, csrf }) => {
  try {
    return await this.API.post(path, data, headers)
  } catch (ex) {
    throw ex
  }
}

const put = async ({ path, data, csrf }) => {
  try {
    let headers = {}
    if (csrf) headers = { ...csrf }
    return await this.API.put(path, data, { headers })
  } catch (ex) {
    throw ex
  }
}

const dell = async ({ path, csrf }) => {
  try {
    let headers = {}
    if (csrf) headers = { ...csrf }
    return await this.API.delete(path, { headers })
  } catch (ex) {
    throw ex
  }
}

const patch = async ({ path, data, csrf }) => {
  let headers = {}
  if (csrf) headers = { ...csrf }
  return await this.API.patch(path, data, { headers })
}

export default {
  post,
  dell,
  fetch,
  patch,
  put,
  postUser,
}
