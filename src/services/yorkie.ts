import yorkie from 'yorkie-js-sdk'

const yorkieClient = new yorkie.Client('https://api.yorkie.dev', {
  apiKey: import.meta.env.VITE_YORKIE_API_KEY,
})

export default yorkieClient
