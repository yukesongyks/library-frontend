import request from '../utils/request'

export function getHello() {
  return request.get('/hello')
}

export function computeHash(input, algorithm) {
  return request.post('/hash', { input, algorithm })
}

export function sortNumbers(numbers, order) {
  return request.post('/sort', { numbers, order })
}

export function getStatsOverview() {
  return request.get('/stats/overview')
}

export function getExportUrl(type, format = 'json') {
  return `/api/export?type=${type}&format=${format}`
}