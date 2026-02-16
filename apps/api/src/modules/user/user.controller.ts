import { UserService, type UserListQuery, type UserListResult } from './user.service';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list(query: UserListQuery): Promise<UserListResult> {
    return this.userService.list(query);
  }
}
