import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  config.headers['X-User-Id'] = 'user-001';
  config.headers['X-User-Name'] = '测试用户';
  config.headers['X-User-Type'] = '内部员工';
  config.headers['X-User-Level'] = 'P5';
  config.headers['X-User-Dept'] = '技术部';
  return config;
});

client.interceptors.response.use(
  (res) => {
    if (res.data?.code !== 200) {
      return Promise.reject(new Error(res.data?.message || '请求失败'));
    }
    return res.data.data;
  },
  (err) => Promise.reject(err)
);

export default client;