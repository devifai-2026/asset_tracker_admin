export const APIEndpoints = {
  // Authentication
  companyLogin: '/company/login',
  viewPermissions: '/company/view-permissions',
  changePassword: '/change-password',
  forgotPasword: '/sale-service/forgot-password',

  // Maintanance
  getOwnMaintenanceList: '/sale-service/get-own-maintanance-list',
  getMaintenanceById: '/sale-service/get-own-maintance-id',
  acceptMaintenance: '/sale-service/accept-maintenance',
  getOwnWallet: '/sale-service/get-own-wallet',
  sendBackParts: '/sale-service/send-back',

  // New Maintenance Endpoints
  getAllMaintenance: '/maintenance/get_all',
  getMaintenanceByIdNew: '/maintenance/get_by_id',
  createMaintenance: '/maintenance/create',
  uploadMaintenancePhoto: '/maintenance/upload_photo',
  updateMaintenance: '/maintenance/update',

  // Clouser Request
  acceptCloser: 'maintenance/accept-closer-request',

  // Parts Inventory
  installPart: '/sale-service/install-part',
  requestPart: '/sale-service/request-part',
  removePart: '/sale-service/remove-part',
  getAllInventoryPart: '/sale-service/get-all-inventory-part',
  getAllInventoryPartAdmin: '/maintenance/get-all-inventory-part',
  searchParts: '/sale-service/search-part-inventory',
  approvePartsRequest: '/maintenance/edit-aproval-list',
  assignParts: 'maintenance/assign-part',

  // Local purchase
  entryPartToApprove: '/sale-service/entry-part-to-approve',

  // Assets
  getAllAssets: '/asset/get_all',

  // Comments
  addComment: '/maintenance/add-comment',

  // Service Sale Persons
  assignServicePerson: '/maintenance/assign-service-person',

  // sale service
  uploadPhoto: '/sale-service/upload_photo',
  addCommentSale: '/sale-service/add-comment',

  // Ratings
  getRatings: '/sale-service/ratings?maintenance-id=',
};
