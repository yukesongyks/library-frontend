/**
 * 鉴权 Store - 管理登录态与用户信息
 *
 * 对齐 design.md §5.1.3.1 JWT 鉴权流程
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { post } from '@/utils/request'
import { TOKEN_KEY, USER_INFO_KEY } from '@/constants/cost'
import type { LoginDTO, LoginVO, SysRoleCode } from '@/types/cost'

interface StoredUserInfo {
  userId: number
  username: string
  roleCode: SysRoleCode
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<StoredUserInfo | null>(loadUserInfo())

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.roleCode === 'ADMIN')

  function loadUserInfo(): StoredUserInfo | null {
    const raw = localStorage.getItem(USER_INFO_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as StoredUserInfo
      } catch {
        return null
      }
    }
    return null
  }

  /** W01 登录 */
  async function login(dto: LoginDTO): Promise<void> {
    const data = await post<LoginVO>('/auth/login', dto)
    token.value = data.token
    userInfo.value = { userId: data.userId, username: data.username, roleCode: data.roleCode }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo.value))
  }

  /** 登出 */
  function logout(): void {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
  }

  return { token, userInfo, isLoggedIn, isAdmin, login, logout }
})
