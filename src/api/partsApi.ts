// api/partsApi.ts
import { authClient } from '../services/api.clients';
import { APIEndpoints } from '../services/api.endpoints';

export interface InventoryPart {
  id: number;
  part_no: string;
  description: string;
  available_quantity: number;
}

export interface PartRequest {
  part_id: number;
  maintenance_id: string;
  quantity: string;
  is_local_purchase: boolean;
  local_purchase_details?: string;
}

export interface PartRemoval {
  part_id: number;
  maintenance_id: string;
  quantity: string;
  reason: string;
}

export interface PartsResponse {
  data: any;
  msg: string;
  success: boolean;
}

export interface LocalPurchaseRequest {
  part_no: string;
  part_name: string;
  part_description?: string;
  entry_date?: string;
  is_arrived?: boolean;
  is_refurbish?: boolean;
  quantity: number;
  price: number;
  maintenance_id: string;
}

export const partsApi = {
  // Get all inventory parts
  getAllInventoryParts: async (): Promise<InventoryPart[]> => {
    const response = await authClient.get(APIEndpoints.getAllInventoryPart);
    console.log('Inventory Parts Response:', response.data);
    return response.data || [];
  },

  // Request parts
  requestParts: async (parts: PartRequest[]): Promise<PartsResponse> => {
    const response = await authClient.post(APIEndpoints.requestPart, parts);
    return response.data;
  },

  // Remove parts
  removeParts: async (parts: PartRemoval[]): Promise<PartsResponse> => {
    const response = await authClient.post(APIEndpoints.removePart, parts);
    return response.data;
  },

  // Local purchase - entry part to approve
  entryPartToApprove: async (
    localPurchase: LocalPurchaseRequest,
  ): Promise<PartsResponse> => {
    const response = await authClient.post(
      APIEndpoints.entryPartToApprove,
      localPurchase,
    );
    return response.data;
  },

  assignParts: async (parts: any[]): Promise<PartsResponse> => {
    const response = await authClient.post(APIEndpoints.assignParts, parts);
    return response.data;
  },

  getAllInventoryPartAdmin: async (): Promise<InventoryPart[]> => {
    const response = await authClient.get(
      APIEndpoints.getAllInventoryPartAdmin,
    );
    console.log('Admin Inventory Parts Response:', response.data);
    return response.data || [];
  },
};
