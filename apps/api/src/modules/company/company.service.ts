export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface CompanyListQuery {
  keyword?: string;
  status?: 'active' | 'inactive';
}

export interface CompanyListResult {
  items: Company[];
  total: number;
}

export class CompanyService {
  private readonly companies: Company[] = [];

  async seed(input: Omit<Company, 'id'>): Promise<void> {
    this.companies.push({
      id: `c_${this.companies.length + 1}`,
      ...input
    });
  }

  async list(query: CompanyListQuery): Promise<CompanyListResult> {
    const keyword = query.keyword?.trim();

    const filtered = this.companies.filter((item) => {
      const keywordOk = keyword ? item.name.includes(keyword) : true;
      const statusOk = query.status ? item.status === query.status : true;
      return keywordOk && statusOk;
    });

    return {
      items: filtered,
      total: filtered.length
    };
  }
}
