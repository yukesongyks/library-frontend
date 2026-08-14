import axios from 'axios';

const BASE_URL = '/api';
const TIMEOUT = 30000;

// 通用 JSON 客户端（自动解包 Result<T>.data）
const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

// Blob 下载客户端（不做 JSON 解包，不拦截 responseType: 'blob'）
const blobClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

// 共享请求拦截器：注入用户身份 header
function addUserHeaders(config: any) {
  config.headers['X-User-Id'] = 'user-001';
  config.headers['X-User-Name'] = '测试用户';
  config.headers['X-User-Type'] = '内部员工';
  config.headers['X-User-Level'] = 'P5';
  config.headers['X-User-Dept'] = '技术部';
  return config;
}

client.interceptors.request.use(addUserHeaders);
blobClient.interceptors.request.use(addUserHeaders);

client.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 200) {
      return Promise.reject(new Error(res.data?.message || '请求失败'));
    }
    return res.data.data;
  },
  (err) => Promise.reject(err)
);

// blobClient 不注册响应拦截器，原样返回 axios response

export default client;
export { blobClient };