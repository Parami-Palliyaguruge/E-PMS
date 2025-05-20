// User related types
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  status?: UserStatus;
  businessId?: string;
  lastActive?: string;
  createdAt?: string;
  permissions: Permission[];
  updatedAt?: Date;
  photoURL?: string;
  department?: string;
  createdBy?: string;
  // For backwards compatibility with the new permission structure
  detailedPermissions?: {
    canCreateAccounts?: boolean;
    canCreateItems?: boolean;
    canCreateInvoices?: boolean;
    canCreatePOs?: boolean;
    canEditItems?: boolean;
    canDeleteItems?: boolean;
    canApprove?: boolean;
    requiresApproval?: boolean;
  };
}

export type UserRole = 'admin' | 'manager' | 'officer' | 'staff';

export type Permission = 
  | 'create_users' 
  | 'edit_users' 
  | 'view_users' 
  | 'delete_users'
  | 'approve_purchase_orders'
  | 'manage_inventory'
  | 'create_purchase_orders'
  | 'create_invoices';

// Business related types
export interface Business {
  id: string;
  name: string;
  ownerId: string;
  address?: Address;
  contactEmail?: string;
  contactPhone?: string;
  logo?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Supplier related types
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: Address;
  category?: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Address related types
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Purchase Order related types
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  requestedBy: string;
  approvedBy?: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  expectedDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  receivedDate?: Date;
}

export type PurchaseOrderStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
}

// Inventory related types
export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  reorderPoint?: number;
  location?: string;
  supplierIds?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

// Invoice related types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  relatedPurchaseOrderId?: string;
  status: InvoiceStatus;
  amount: number;
  taxes?: number;
  totalAmount: number;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
  attachmentUrl?: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  paidDate?: Date;
}

export type InvoiceStatus = 
  | 'pending'
  | 'approved'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Budget related types
export interface Budget {
  id: string;
  name: string;
  department?: string;
  category?: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  spent: number;
  remaining: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Context Types
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<boolean>;
  createBusiness: (businessName: string, businessData: any) => Promise<string>;
  resetPassword: (email: string) => Promise<boolean>;
}

export interface BusinessContextType {
  businessData: Business | null;
  loading: boolean;
  error: string | null;
  currentBusiness: Business | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form Types
export interface LoginFormInputs {
  email: string;
  password: string;
}

export interface RegisterFormInputs {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface BusinessFormInputs {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: Address;
} 