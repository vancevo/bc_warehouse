export type Role = 'ADMIN' | 'STAFF' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: string;
  mustChangePassword: boolean;
}

export interface Hub {
  id: string;
  code: string;
  name: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  minimumStock: string | number;
  note?: string;
  active: boolean;
}

export interface InventoryRow {
  hub: Hub;
  material: Pick<Material, 'id' | 'code' | 'name' | 'category' | 'unit'>;
  quantity: number;
  minimumStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface Transaction {
  id: string;
  transactionNo: string;
  type: 'IN' | 'OUT' | 'KIT_OUT' | 'TRANSFER' | 'KIT_TRANSFER' | 'ADJUSTMENT';
  status: 'POSTED' | 'VOID';
  transactionDate: string;
  hub: Hub;
  destinationHub?: Hub;
  kit?: { id: string; code: string; name: string };
  kitQuantity?: number;
  counterparty?: string;
  createdBy: { fullName: string; email: string };
  items: Array<{ id: string; quantity: string | number; material: Material }>;
}

export interface Kit {
  id: string;
  code: string;
  name: string;
  items: Array<{
    id: string;
    quantity: string | number;
    material: Pick<Material, 'id' | 'code' | 'name' | 'unit'>;
  }>;
}

export interface KitCapacity {
  hub: Hub;
  kits: Array<{
    id: string;
    code: string;
    name: string;
    maximum: number;
    limitingMaterials: Array<{
      material: Pick<Material, 'id' | 'code' | 'name' | 'unit'>;
      stock: number;
      perKit: number;
      possibleKits: number;
    }>;
  }>;
}

export interface KitSummary {
  hub: Hub;
  kits: Array<KitCapacity['kits'][number] & {
    issuedQuantity: number;
  }>;
}
