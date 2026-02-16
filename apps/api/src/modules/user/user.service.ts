export interface UserListQuery {
  page: number;
  pageSize: number;
}

export interface UserSeedInput {
  username: string;
  roles: string[];
  department: string;
}

export interface UserListItem {
  id: string;
  username: string;
  roles: string[];
  department: string;
}

export interface UserListResult {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export class UserService {
  private readonly users: UserListItem[] = [];

  async seed(input: UserSeedInput): Promise<void> {
    this.users.push({
      id: `u_${this.users.length + 1}`,
      username: input.username,
      roles: input.roles,
      department: input.department
    });
  }

  async list(query: UserListQuery): Promise<UserListResult> {
    const start = (query.page - 1) * query.pageSize;
    const end = start + query.pageSize;

    return {
      items: this.users.slice(start, end),
      total: this.users.length,
      page: query.page,
      pageSize: query.pageSize
    };
  }
}
