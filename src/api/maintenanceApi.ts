import { authClient } from '../services/api.clients';
import { APIEndpoints } from '../services/api.endpoints';

export interface MaintenanceItem {
  asset_id: string;
  asset_no: string;
  compaint_date: string;
  id: string;
  is_ready_for_closer: boolean | null;
  issue_date: string;
  location: string | null;
  parts: MaintenancePart[];
  priority: string | null;
  status: string;
  ticket_no: string;
  title: string | null;
  types: string;
}

export interface MaintenancePart {
  id: string;
  installation: boolean;
  part_no: string;
  quantity: string;
}

export interface MaintenanceDetail {
  action_taken: string | null;
  asset: {
    asset_no: string;
    asset_sold_date: string | null;
    capacity: string;
    category: string;
    created_at: string;
    custom_duty_date_of_clearance: string;
    description: string;
    device_hash: string;
    device_id: string;
    device_no: string;
    group: string;
    hieght_machine: string;
    id: string;
    installation_date: string;
    is_sold: boolean;
    make: string;
    model: string;
    platform: string;
    purchased_from: string;
    rating: string;
    rfid: string;
    serial_no: string;
    site_location: string;
    yom: string;
  };
  asset_id: string;
  asset_no: string;
  attachments: any[];
  closer_date: string | null;
  clouser_comment: string | null;
  comments: MaintenanceComment[];
  compaint_date: string;
  complaint: string;
  complaint_type: string;
  description: string;
  id: string;
  instruction: string | null;
  is_accepeted: boolean | null;
  is_ready_for_closer: boolean | null;
  issue_date: string;
  lease_customer: string | null;
  lease_end_date: string | null;
  lease_location: string | null;
  lease_operator: any[];
  lease_sale_person: string | null;
  location: string | null;
  parts: MaintenancePart[];
  photos: any[];
  priority: string;
  ready_date: string;
  reject_comments: RejectComment[];
  serviceSalePersons: [];
  status: string;
  temporary: boolean;
  ticket_no: string;
  total_part_price: number;
  types: string;
  visit_date: string | null;
}

// Add these new interfaces
export interface RejectComment {
  comment_for_reject: string;
  is_accepeted: boolean;
  name: string;
}

export interface ServiceSalePerson {
  id: number;
  name: string;
  wallet: WalletPart[];
}

export interface WalletPart {
  already_released: number;
  approve_quantity: number;
  comsumed_quantity: number | null;
  id: number;
  in_stock_quantity: string;
  install_quantity: number | null;
  is_approved: boolean;
  is_local_part: boolean | null;
  maintenance_id: string;
  part_inventory_id: number | null;
  part_no: string;
  requested_date: string;
  requested_quantity: number | null;
}

export interface MaintenanceComment {
  by_me: boolean;
  comment: string;
  comment_by_employee: string;
  comment_by_name: string;
  comment_by_service_person: string | null;
  id: number;
  time: string;
  visit_date: string | null;
}

export interface MaintenanceResponse {
  data: MaintenanceItem[];
  msg: string;
  types: string;
}

export interface MaintenanceDetailResponse {
  data: MaintenanceDetail;
  msg: string;
  types: string;
}

interface MaintenanceState {
  list: MaintenanceItem[];
  currentDetail: MaintenanceDetail | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  detailError: string | null;
  lastFetched: number | null;
}

export interface AcceptMaintenancePayload {
  is_accepted: boolean;
  comment: string;
  maintenance_id: string;
}

export interface AcceptMaintenanceResponse {
  msg: string;
  success: boolean;
}

// export interface WalletPart {
//   already_released: number;
//   approve_quantity: number;
//   comsumed_quantity: number | null;
//   id: number;
//   install_quantity: number | null;
//   is_approved: boolean;
//   is_removal_part: boolean;
//   maintenance_id: string;
//   part_inventory_id: number | null;
//   part_no: string;
//   requested_date: string;
//   requested_quantity: number | null;
// }

export interface Asset {
  asset_no: string;
  asset_odoo_id: string | null;
  category: string;
  created_at: string;
  device_no: string;
  id: string;
  is_sold: boolean;
  maintenance_status: string | null;
  make: string;
  model: string;
  serial_no: string;
  total_data: number;
  yom: string;
}

export interface AssetsResponse {
  maintenace_id: string;
  tiket_no: string;
}

export interface WalletResponse {
  data: WalletPart[];
  msg: string;
  types: string;
}

export interface SendBackPayload {
  id: number;
  back_item_count: number;
}

export interface AcceptCloser {
  accept: boolean;
  maintenance_id: string;
}

export interface SendBackResponse {
  msg: string;
  success: boolean;
}

export interface CreateMaintenancePayload {
  asset_no: string;
  asset_id: string;
  complaint_type: string;
  complaint: string;
  description: string;
  issue_date: string;
  complaint_date: string;
}

export interface CreateMaintenanceResponse {
  maintenace_id: string;
  tiket_no: string;
  msg?: string;
  success?: boolean;
}

export interface UploadMaintenancePhotoPayload {
  types: string;
  maintenance_id: string;
  photo: any;
}

export interface UploadMaintenancePhotoResponse {
  msg: string;
  success: boolean;
}

export interface ServicePerson {
  email: string;
  id: number;
  name: string;
}

export interface AssignServicePersonPayload {
  maintenance_id: string;
  service_person: { id: number }[];
}

export interface AddCommentPayload {
  maintenance_id: string;
  comment: string;
}

export interface GetServicePersonsResponse {
  data: ServicePerson[];
  msg: string;
  types: string;
}

export interface AssignServicePersonResponse {
  msg: string;
  success: boolean;
}

export interface AddCommentResponse {
  msg: string;
  success: boolean;
}

export interface UpdateMaintenancePayload {
  id: string;
  complaint: string;
  complaint_type: string;
  description: string;
  types: string;
  priority: string;
  status: string;
  ready_date: string | null;
}

export interface UpdateMaintenanceResponse {
  msg: string;
  success: boolean;
}

export const maintenanceApi = {
  getOwnMaintenanceList: async (): Promise<MaintenanceResponse> => {
    const response = await authClient.get(APIEndpoints.getOwnMaintenanceList);
    return response.data;
  },

  getMaintenanceById: async (
    maintenanceId: string,
  ): Promise<MaintenanceDetailResponse> => {
    const response = await authClient.get(APIEndpoints.getMaintenanceById, {
      params: { 'maintenace-id': maintenanceId },
    });
    return response.data;
  },

  getAllMaintenance: async (): Promise<MaintenanceResponse> => {
    const response = await authClient.get(APIEndpoints.getAllMaintenance);
    return response.data;
  },

  getAllAssets: async (): Promise<AssetsResponse> => {
    const response = await authClient.get(APIEndpoints.getAllAssets);
    return response.data;
  },

  getMaintenanceByIdNew: async (
    maintenanceId: string,
  ): Promise<MaintenanceDetailResponse> => {
    const url = `${APIEndpoints.getMaintenanceByIdNew}?id=${maintenanceId}`;
    const response = await authClient.get(url);
    return response.data;
  },

  acceptMaintenance: async (
    payload: AcceptMaintenancePayload,
  ): Promise<AcceptMaintenanceResponse> => {
    const response = await authClient.post(
      APIEndpoints.acceptMaintenance,
      payload,
    );
    return response.data;
  },

  getOwnWallet: async (): Promise<WalletResponse> => {
    const response = await authClient.get(APIEndpoints.getOwnWallet);
    return response.data;
  },

  sendBackParts: async (
    payload: SendBackPayload[],
  ): Promise<SendBackResponse> => {
    const response = await authClient.post(APIEndpoints.sendBackParts, payload);
    return response.data;
  },

  acceptCloserRequest: async (
    payload: AcceptCloser,
  ): Promise<SendBackResponse> => {
    const response = await authClient.post(APIEndpoints.acceptCloser, payload);
    return response.data;
  },

  // NEW: Create maintenance endpoint
  createMaintenance: async (
    payload: CreateMaintenancePayload,
  ): Promise<CreateMaintenanceResponse> => {
    const response = await authClient.post(
      APIEndpoints.createMaintenance,
      payload,
    );
    return response.data;
  },

  // NEW: Upload maintenance photo endpoint
  uploadMaintenancePhoto: async (
    formData: FormData,
  ): Promise<UploadMaintenancePhotoResponse> => {
    const response = await authClient.post(
      APIEndpoints.uploadMaintenancePhoto,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  approvePartsRequest: async (payload: any[]) => {
    try {
      const response = await authClient.post(
        APIEndpoints.approvePartsRequest,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error('Error approving parts:', error);
      throw error;
    }
  },

  // Get all service persons
  getServicePersons: async (): Promise<GetServicePersonsResponse> => {
    const response = await authClient.get('/maintenance/get-service-persons');
    return response.data;
  },

  // Assign service person to maintenance
  assignServicePerson: async (
    payload: AssignServicePersonPayload,
  ): Promise<AssignServicePersonResponse> => {
    const response = await authClient.post(
      APIEndpoints.assignServicePerson,
      payload,
    );
    return response.data;
  },

  // Add comment to maintenance
  addComment: async (
    payload: AddCommentPayload,
  ): Promise<AddCommentResponse> => {
    const response = await authClient.post(APIEndpoints.addComment, payload);
    return response.data;
  },

  updateMaintenance: async (
    payload: UpdateMaintenancePayload,
  ): Promise<UpdateMaintenanceResponse> => {
    const response = await authClient.post(
      APIEndpoints.updateMaintenance,
      payload,
    );
    return response.data;
  },
};
