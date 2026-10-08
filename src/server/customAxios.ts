import axios from 'axios'

/**
 * 父应用 axios 实例：通过 qiankun props 注入子应用，实现请求层共享
 * （子应用不自己 create axios，保证 baseURL / 拦截器 / 鉴权口径统一）。
 *
 * 本 change 仅搭骨架，拦截器内的 token 注入、错误码处理、401 跳登录等在后续 change 补。
 */
const customAxios = axios.create({
  baseURL: '/api',
  timeout: 10000
})

customAxios.interceptors.request.use((config) => {
  // 占位：后续 change 在此注入 token / tenant / traceId
  return config
})

customAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 占位：后续 change 在此统一处理业务错误码与 401 登出
    return Promise.reject(error)
  }
)

export default customAxios
