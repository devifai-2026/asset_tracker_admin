export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ChangePassword: undefined;
  MainTabs: undefined;
  HeadMainTabs: undefined;
  AdminMainTabs: undefined;
  OtpVerification: undefined;
  OpenAssetsDetails: undefined;
  AcceptAssetDetails: undefined;
  Profile: undefined;
  CreateMaintenance: undefined;
  OpenDetails: undefined;
  PartsDetails: undefined;
  SePartsDetails: { maintenanceId: string };
  RequestParts: { maintenanceId: string };
  RemoveParts: { maintenanceId: string };
  MaintenanceRating: {
    maintenanceId: string;
    temporary: boolean;
    types: string
  };
};

// Declare global namespace for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}


export interface AssetDetails {
  assetName: string;
  capacity: string;
  access: string;
  modelNo: string;
  category: string;
  customer: string;
  mode: string;
  retailDate: string;
  serialNo: string;
  year: string;
  scaleFactor: string;
  sales: string;
}

export interface MaintenanceDetails {
  ticketId: string;
  complainDate: string;
  breakdownType: string;
  breakdownTitle: string;
  breakdownDate: string;
  priority: string;
  status: string;
  deadline: string;
  engineer: string;
}