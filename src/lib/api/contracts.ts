/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeXFlowX API — TypeScript Contracts
 *
 * Matches the live backend at https://api-core.nexflowx.tech/api/v1 (Core Bank V2)
 * All types reflect the actual JSON responses from the API.
 * Simplified transaction statuses focused on financial settlement.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────

export type TransactionType = 'payment' | 'settlement' | 'conversion' | 'refund';

export type TransactionStatus =
  | 'pending'
  | 'gateway_confirmed'
  | 'failed'
  | 'settled';

export type LogisticsStatus = 'processing' | 'shipped' | 'delivered';

export type PipelineStageId =
  | 'pending'
  | 'gateway_confirmed'
  | 'settled';

export type KeyEnvironment = 'production' | 'sandbox';
export type KeyStatus = 'active' | 'revoked';

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'CRITICAL'
  | 'INTEGRATION_IN_PROGRESS';

export type CapacityStatus = 'UNLIMITED' | 'LIMITED' | 'DEPLETED';

// ─── 1. AUTH ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// POST /api/v1/auth/logout
// GET  /api/v1/auth/me

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refresh_token?: string;
  expires_in?: number;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  organization_id: string;
  webhook_url?: string;
  webhook_secret?: string;
  created_at: string;
  last_login: string | null;
}

export interface AuthMeResponse {
  success: boolean;
  user: AuthUser;
}

// ─── 2. STORES (Multi-Tenant) ─────────────────────────────────────────────
// GET    /api/v1/stores
// POST   /api/v1/stores
// GET    /api/v1/stores/:id
// PATCH  /api/v1/stores/:id
// DELETE /api/v1/stores/:id

export interface Store {
  id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  webhook_url?: string;
  webhook_secret?: string;
  default_provider?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreRequest {
  name: string;
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  webhook_url?: string;
  default_provider?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  webhook_url?: string;
  default_provider?: string;
}

export interface StoreResponse {
  success: boolean;
  data: Store;
}

export interface StoresResponse {
  success: boolean;
  data: Store[];
}

// ─── 3. PIPELINE ─────────────────────────────────────────────────────────
// GET /api/v1/pipeline
//
// Response format:
// {
//   "success": true,
//   "data": {
//     "pending": { "total": 1250.00, "count": 12 },
//     "gateway_confirmed": { "total": 8540.50, "count": 45 },
//     ...
//   }
// }

export interface PipelineStageData {
  total: number;
  count: number;
}

export type PipelineData = Record<PipelineStageId, PipelineStageData>;

export interface PipelineResponse {
  success: boolean;
  data: PipelineData;
}

// ─── 4. TRANSACTIONS ─────────────────────────────────────────────────────
// GET    /api/v1/transactions?page=1&limit=25&status=pending&search=...&store_id=...
// PATCH  /api/v1/transactions/:id/status

export interface Transaction {
  id: string;
  external_id?: string;
  type: TransactionType;
  status: TransactionStatus;
  logistics_status?: LogisticsStatus;
  amount: number;
  net_amount?: number;
  fee_amount?: number;
  amount_refunded?: number;
  currency: string;
  country_code: string;
  payment_method: string;
  provider_name: string;
  payer_name?: string;
  payer_email?: string;
  customer_email?: string;
  payee_id?: string;
  description?: string;
  shareable_url?: string;
  metadata?: Record<string, unknown>;
  error_code?: string;
  error_message?: string;
  clears_at?: string;
  settled_at?: string;
  store?: {
    id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface UpdateStatusRequest {
  status: TransactionStatus;
}

export interface UpdateStatusResponse {
  success: boolean;
  data: Transaction;
}

export interface UpdateLogisticsRequest {
  status: LogisticsStatus;
}

export interface UpdateLogisticsResponse {
  success: boolean;
  data: Transaction;
}

// ─── 5. PAYMENT LINKS ─────────────────────────────────────────────────────
// POST /api/v1/payment-links   → creates intent, returns shareable_url
// GET  /api/v1/payment-links   → lists created links

export interface CreatePaymentLinkRequest {
  amount: number;
  currency?: string;
  description?: string;
  store_id?: string;
  provider_name?: string;
}

export interface PaymentLink {
  id: string;
  shareable_url: string;
  short_code?: string;
  amount: number;
  currency: string;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  payer_name?: string;
  description?: string;
  created_at: string;
}

export interface CreatePaymentLinkResponse {
  success: boolean;
  data: PaymentLink;
}

export interface PaymentLinksResponse {
  success: boolean;
  data: PaymentLink[];
}

// ─── 5. API KEYS ─────────────────────────────────────────────────────────
// GET    /api/v1/api-keys
// POST   /api/v1/api-keys
// DELETE /api/v1/api-keys/:id

export interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  key_hash?: string;       // returned by GET /api-keys
  key_full?: string;       // only on creation
  environment: KeyEnvironment;
  status: KeyStatus;
  last_used_at?: string;
  last_ips?: string[];
  created_at: string;
  revoked_at?: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  environment: KeyEnvironment;
}

export interface CreateAPIKeyResponse {
  success: boolean;
  data: APIKey;
  warning?: string;
}

export interface APIKeysResponse {
  success: boolean;
  data: Omit<APIKey, 'key_full'>[];
}

// ─── 7. GATEWAY SETTINGS ─────────────────────────────────────────────────
// GET    /api/v1/settings/gateways
// POST   /api/v1/settings/gateways
// PATCH  /api/v1/settings/gateways/:id
// DELETE /api/v1/settings/gateways/:id

export type GatewayProvider = 'stripe' | 'sumup' | 'paypal';

export interface GatewaySettings {
  id: string;
  name: string;
  provider: GatewayProvider;
  provider_api_key?: string;  // PayFac V2: optional — credentials managed by Admin
  provider_secret?: string;   // PayFac V2: optional — credentials managed by Admin
  master_provider_id?: string | null; // PayFac V2: link to MasterProvider
  store_id?: string;  // null = global, with value = store-specific
  environment: KeyEnvironment;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateGatewayRequest {
  name: string;
  provider: GatewayProvider;
  provider_api_key?: string;  // PayFac V2: optional — credentials managed by Admin
  provider_secret?: string;   // PayFac V2: optional — credentials managed by Admin
  master_provider_id?: string | null; // PayFac V2: link to MasterProvider
  store_id?: string | null;
  environment: KeyEnvironment;
}

export interface UpdateGatewayRequest {
  name?: string;
  provider_api_key?: string;    // PayFac V2: optional
  provider_secret?: string;     // PayFac V2: optional
  master_provider_id?: string | null; // PayFac V2: link to MasterProvider
  store_id?: string | null;
  status?: 'active' | 'inactive';
}

export interface GatewayResponse {
  success: boolean;
  data: GatewaySettings;
}

export interface GatewaysResponse {
  success: boolean;
  data: GatewaySettings[];
}

// ─── 12. MASTER PROVIDERS (PayFac V2 — Admin Only) ──────────────
// GET    /api/v1/master-providers
// POST   /api/v1/master-providers
// PATCH  /api/v1/master-providers/:id
// DELETE /api/v1/master-providers/:id

export interface MasterProvider {
  id: string;
  providerType: string;
  companyName: string;
  merchantOfRecord?: string;
  supportedMethods: string[];
  supportedCurrencies: string[];
  mode: 'test' | 'live';
  isActive: boolean;
  costPercentage: number;
  costFixed: number;
  settlementDays: number;
  priorityScore: number;
  monthlyVolumeLimit?: number;
  currentMonthVolume: number;
  healthStatus: string;
  credentials_live?: Record<string, any>;
  credentials_test?: Record<string, any>;
}

export interface CreateMasterProviderRequest {
  providerType: string;
  companyName: string;
  merchantOfRecord?: string;
  supportedMethods: string[];
  supportedCurrencies: string[];
  mode: 'test' | 'live';
  isActive?: boolean;
  costPercentage: number;
  costFixed: number;
  settlementDays: number;
  priorityScore: number;
  monthlyVolumeLimit?: number;
  credentials_live?: Record<string, any>;
  credentials_test?: Record<string, any>;
}

export interface UpdateMasterProviderRequest {
  providerType?: string;
  companyName?: string;
  merchantOfRecord?: string;
  supportedMethods?: string[];
  supportedCurrencies?: string[];
  mode?: 'test' | 'live';
  isActive?: boolean;
  costPercentage?: number;
  costFixed?: number;
  settlementDays?: number;
  priorityScore?: number;
  monthlyVolumeLimit?: number;
  healthStatus?: string;
  credentials_live?: Record<string, any>;
  credentials_test?: Record<string, any>;
}

export interface MasterProviderResponse {
  success: boolean;
  data: MasterProvider;
}

export interface MasterProvidersResponse {
  success: boolean;
  data: MasterProvider[];
}

// ─── 8. USER / WEBHOOK ───────────────────────────────────────────────────
// PATCH /api/v1/users/me  → update webhook_url

export interface UpdateUserRequest {
  webhook_url?: string;
  email?: string;
  name?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  data: AuthUser;
}

// ─── 9. SYSTEM STATE (Capacity Matrix — mock kept) ───────────────────────

export interface SystemStateEntry {
  country_code: string;
  payment_method: string;
  availability_status: AvailabilityStatus;
  provider_name?: string;
  priority?: number;
  fee_percent?: number;
  fee_fixed?: number;
  sla_hours?: number;
  max_volume_daily?: number | null;
  used_volume_daily?: number | null;
  remaining_volume?: number | null;
  capacity_status: CapacityStatus;
  notes?: string;
  is_local?: boolean;
}

// ─── 10. WALLET / TREASURY (Core Bank V2) ───────────────────────────────
// GET /api/v1/wallet

export interface Wallet {
  balance_incoming: number | string;
  balance_pending: number | string;
  balance_available: number | string;
  currency?: string;
  updated_at?: string;
}

export interface WalletResponse {
  success: boolean;
  data: Wallet;
}

// ─── 11. PAYOUTS (Core Bank V2) ──────────────────────────────────────────
// POST /api/v1/payouts

export type PayoutMethod = 'PIX' | 'SEPA' | 'CRYPTO';

export interface CreatePayoutRequest {
  amount: number;
  currency: string;
  method: PayoutMethod;
  destination: string;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  method: PayoutMethod;
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
}

export interface CreatePayoutResponse {
  success: boolean;
  data: Payout;
  message?: string;
}

// ─── ERROR ────────────────────────────────────────────────────────────────

export interface APIError {
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  message?: string;
}
