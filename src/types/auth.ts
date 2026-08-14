export interface UserInfo {
  id: number;
  username: string;
  name: string;
  deptId: number | null;
  status: number;
  roles: string[];
}
