export const authHeader = () => {
  return {
    common: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }
}
