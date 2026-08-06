import axios from 'axios'

const http = axios.create({
  baseURL: '/api/algo',
  timeout: 10000
})

// 算法演示 API 封装
const algoApi = {
  // HelloWorld
  hello() {
    return http.get('/hello')
  },

  // 哈希算法
  hash(input) {
    return http.post('/hash', { input })
  },

  // 冒泡排序
  bubbleSort(numbers) {
    return http.post('/bubble-sort', { numbers })
  },

  // 导出（文件流，responseType: blob）
  export(type, format, data) {
    return http.post('/export', { type, format, data }, { responseType: 'blob' })
  }
}

export default algoApi
