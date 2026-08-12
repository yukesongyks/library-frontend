import axios from 'axios';

const request = axios.create({
  baseURL: '/',
  timeout: 30000,
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const msg = error?.response?.data?.message || error.message || '请求失败';
    console.error('[request error]', msg);
    return Promise.reject(error);
  }
);

export default request;

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
