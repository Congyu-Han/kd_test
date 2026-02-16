import { CompanyService, type CompanyListQuery, type CompanyListResult } from './company.service';

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  list(query: CompanyListQuery): Promise<CompanyListResult> {
    return this.companyService.list(query);
  }
}
