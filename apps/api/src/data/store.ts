import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type RoleRecord = {
  id: string;
  name: string;
  permissions: string[];
};

export type UserRecord = {
  id: string;
  username: string;
  password: string;
  name: string;
  roleId: string;
  status: 'enabled' | 'disabled';
  departmentId: string | null;
};

export type DepartmentRecord = {
  id: string;
  name: string;
  parentId: string | null;
};

export type ServiceProviderRecord = {
  id: string;
  serviceProviderName: string;
  serviceProviderType: string;
  area: string;
  principal: string;
  phone: string;
  enterpriseCount: number;
  userCount: number;
  pricing: number;
  classBalance: number;
  status: 'enabled' | 'disabled';
  createdAt: string;
};

export type ProviderAccountRecord = {
  id: string;
  providerId: string;
  accountName: string;
  accountNo: string;
  bankName: string;
  status: 'enabled' | 'disabled';
};

export type WalletTransactionRecord = {
  id: string;
  transactionTime: string;
  transactionType: string;
  target: string;
  targetType: string;
  classHours: number;
  transactionAmount: number;
  incomeAmount: number;
  orderNo: string;
  remark: string;
  providerId: string | null;
};

export type SalesOrderRecord = {
  id: string;
  orderNo: string;
  customer: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type MonthlyStatRecord = {
  id: string;
  month: string;
  orderCount: number;
  amount: number;
  income: number;
};

export type OfflineOrderRecord = {
  id: string;
  orderNo: string;
  enterprise: string;
  classHours: number;
  amount: number;
  createdAt: string;
};

export type DistributionRecord = {
  id: string;
  enterprise: string;
  providerName: string;
  classHours: number;
  operator: string;
  createdAt: string;
};

export type SalesLedgerRecord = {
  id: string;
  billNo: string;
  customerType: string;
  customerName: string;
  amount: number;
  createdAt: string;
};

export type QuotaPurchaseRecord = {
  id: string;
  providerName: string;
  classHours: number;
  amount: number;
  createdAt: string;
};

export type QuotaRecord = {
  id: string;
  providerName: string;
  action: string;
  classHours: number;
  createdAt: string;
};

export type CouponConfigRecord = {
  id: string;
  couponType: string;
  faceValue: number;
  price: number;
  status: 'enabled' | 'disabled';
};

export type CouponDispatchRecord = {
  id: string;
  couponType: string;
  receiver: string;
  quantity: number;
  operator: string;
  createdAt: string;
};

export type PaymentAccountRecord = {
  id: string;
  accountName: string;
  accountNo: string;
  bankName: string;
  status: 'enabled' | 'disabled';
};

export type CoursewareRecord = {
  id: string;
  title: string;
  industry: string;
  tag: string;
  source: string;
  upVotes: number;
  comments: number;
  downVotes: number;
  duration: string;
  updatedAt: string;
  status: string;
  isTest: boolean;
};

export type Database = {
  meta: {
    nextId: number;
    companyName: string;
    contactPhone: string;
    loginName: string;
  };
  roles: RoleRecord[];
  users: UserRecord[];
  departments: DepartmentRecord[];
  serviceProviders: ServiceProviderRecord[];
  providerAccounts: ProviderAccountRecord[];
  walletTransactions: WalletTransactionRecord[];
  salesOrders: SalesOrderRecord[];
  monthlyStats: MonthlyStatRecord[];
  offlineOrders: OfflineOrderRecord[];
  distributionRecords: DistributionRecord[];
  salesLedgers: SalesLedgerRecord[];
  quotaPurchases: QuotaPurchaseRecord[];
  quotaRecords: QuotaRecord[];
  couponConfigs: CouponConfigRecord[];
  couponDispatches: CouponDispatchRecord[];
  paymentAccounts: PaymentAccountRecord[];
  courseware: CoursewareRecord[];
};

function nowText(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function seedProviders(): ServiceProviderRecord[] {
  return [
    {
      id: 'provider_1',
      serviceProviderName: '安驾课堂晋城分公司',
      serviceProviderType: '服务商',
      area: '晋城市',
      principal: '李唯娜',
      phone: '15582643517',
      enterpriseCount: 1,
      userCount: 0,
      pricing: 3,
      classBalance: 0,
      status: 'enabled',
      createdAt: nowText()
    },
    {
      id: 'provider_2',
      serviceProviderName: '山西耀尚信息技术有限公司高平分公司',
      serviceProviderType: '服务商',
      area: '晋城市',
      principal: '王会青',
      phone: '13111262520',
      enterpriseCount: 1,
      userCount: 0,
      pricing: 15,
      classBalance: 0,
      status: 'enabled',
      createdAt: nowText()
    },
    {
      id: 'provider_3',
      serviceProviderName: '安驾课堂吕梁分公司',
      serviceProviderType: '服务商',
      area: '吕梁市',
      principal: '杨瑞忠',
      phone: '19935185011',
      enterpriseCount: 5,
      userCount: 357,
      pricing: 3,
      classBalance: 548,
      status: 'enabled',
      createdAt: nowText()
    }
  ];
}

function seedCourseware(): CoursewareRecord[] {
  return [
    {
      id: 'course_1',
      title: '出租汽车和小微型客车租赁执法',
      industry: '交通运输',
      tag: '交通执法',
      source: '系统课件',
      upVotes: 3,
      comments: 0,
      downVotes: 0,
      duration: '00:13:18',
      updatedAt: '2026-02-13',
      status: '系统课件',
      isTest: true
    },
    {
      id: 'course_2',
      title: '校车运输照管员安全课堂',
      industry: '交通运输',
      tag: '校车',
      source: '系统课件',
      upVotes: 1,
      comments: 0,
      downVotes: 0,
      duration: '00:10:08',
      updatedAt: '2026-02-13',
      status: '系统课件',
      isTest: true
    },
    {
      id: 'course_3',
      title: '道路运输防御性驾驶课堂',
      industry: '交通运输',
      tag: '防御性驾驶',
      source: '企业课件',
      upVotes: 1,
      comments: 0,
      downVotes: 0,
      duration: '00:09:56',
      updatedAt: '2026-02-13',
      status: '企业课件',
      isTest: false
    }
  ];
}

export function createSeedDatabase(): Database {
  const providers = seedProviders();
  return {
    meta: {
      nextId: 100,
      companyName: '山西诚鼎伟业科技有限责任公司--总代理',
      contactPhone: '17721327559',
      loginName: 'sxcdzdl'
    },
    roles: [
      {
        id: 'role_admin',
        name: '平台管理员',
        permissions: ['*']
      },
      {
        id: 'role_ops',
        name: '运营人员',
        permissions: ['provider.read', 'courseware.read', 'sales.read']
      }
    ],
    users: [
      {
        id: 'user_admin',
        username: 'admin',
        password: 'Passw0rd!',
        name: '系统管理员',
        roleId: 'role_admin',
        status: 'enabled',
        departmentId: 'dep_root'
      },
      {
        id: 'user_ops',
        username: 'sxcdzdl',
        password: 'Han35128819',
        name: '运营商总账号sxcdzdl',
        roleId: 'role_admin',
        status: 'enabled',
        departmentId: 'dep_root'
      }
    ],
    departments: [
      { id: 'dep_root', name: '所有部门', parentId: null },
      { id: 'dep_sales', name: '销售部', parentId: 'dep_root' },
      { id: 'dep_training', name: '培训部', parentId: 'dep_root' }
    ],
    serviceProviders: providers,
    providerAccounts: [
      {
        id: 'pa_1',
        providerId: providers[0].id,
        accountName: '晋城分公司账户',
        accountNo: '6222020001112233',
        bankName: '中国工商银行晋城支行',
        status: 'enabled'
      }
    ],
    walletTransactions: [
      {
        id: 'wallet_1',
        transactionTime: nowText(),
        transactionType: '售课收入',
        target: providers[0].serviceProviderName,
        targetType: '服务商',
        classHours: 30,
        transactionAmount: 300,
        incomeAmount: 42,
        orderNo: 'SO20260216001',
        remark: '线上售课',
        providerId: providers[0].id
      }
    ],
    salesOrders: [
      {
        id: 'sales_1',
        orderNo: 'SO20260216001',
        customer: providers[0].serviceProviderName,
        amount: 300,
        status: '已支付',
        createdAt: nowText()
      }
    ],
    monthlyStats: [
      {
        id: 'month_2026_01',
        month: '2026-01',
        orderCount: 11,
        amount: 3360,
        income: 412
      },
      {
        id: 'month_2026_02',
        month: '2026-02',
        orderCount: 9,
        amount: 2950,
        income: 380
      }
    ],
    offlineOrders: [
      {
        id: 'offline_1',
        orderNo: 'OF20260216001',
        enterprise: '晋城汇晋科贸有限公司',
        classHours: 50,
        amount: 750,
        createdAt: nowText()
      }
    ],
    distributionRecords: [
      {
        id: 'dist_1',
        enterprise: '晋城汇晋科贸有限公司',
        providerName: providers[0].serviceProviderName,
        classHours: 30,
        operator: '系统管理员',
        createdAt: nowText()
      }
    ],
    salesLedgers: [
      {
        id: 'ledger_1',
        billNo: 'BL20260216001',
        customerType: '两类人员',
        customerName: '晋城市某运输公司',
        amount: 1200,
        createdAt: nowText()
      }
    ],
    quotaPurchases: [
      {
        id: 'qp_1',
        providerName: providers[0].serviceProviderName,
        classHours: 100,
        amount: 1500,
        createdAt: nowText()
      }
    ],
    quotaRecords: [
      {
        id: 'qr_1',
        providerName: providers[0].serviceProviderName,
        action: '购买',
        classHours: 100,
        createdAt: nowText()
      }
    ],
    couponConfigs: [
      {
        id: 'coupon_cfg_1',
        couponType: '基础培训券',
        faceValue: 100,
        price: 95,
        status: 'enabled'
      }
    ],
    couponDispatches: [
      {
        id: 'coupon_dispatch_1',
        couponType: '基础培训券',
        receiver: providers[0].serviceProviderName,
        quantity: 20,
        operator: '系统管理员',
        createdAt: nowText()
      }
    ],
    paymentAccounts: [
      {
        id: 'pay_acc_1',
        accountName: '平台收款账户',
        accountNo: '6222020005558888',
        bankName: '中国建设银行太原支行',
        status: 'enabled'
      }
    ],
    courseware: seedCourseware()
  };
}

function getDefaultFilePath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '../../.data/kds-admin-db.json');
}

export function createJsonStore(explicitPath?: string): {
  db: Database;
  save: () => void;
  nextId: (prefix: string) => string;
} {
  const filePath = explicitPath || process.env.KDS_DATA_FILE || getDefaultFilePath();

  let db: Database;
  if (existsSync(filePath)) {
    db = JSON.parse(readFileSync(filePath, 'utf8')) as Database;
  } else {
    db = createSeedDatabase();
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf8');
  }

  const save = () => {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf8');
  };

  const nextId = (prefix: string): string => {
    db.meta.nextId += 1;
    return `${prefix}_${db.meta.nextId}`;
  };

  return {
    get db() {
      return db;
    },
    save,
    nextId
  };
}
