
export type Language = 'en' | 'te' | 'hi';
export type UserRole = 'Admin' | 'Passenger' | 'Conductor';

export enum BusStatus {
  ARRIVED = 'Arrived',
  ON_THE_WAY = 'On the Way',
  DELAYED = 'Delayed'
}

export interface Bus {
  id: string;
  name: string;
  number: string;
  status: BusStatus;
  updatedBy: string;
  updatedByType: UserRole;
  routeStops: string[];
  delayMinutes?: number;
  availableTomorrow: boolean;
  availableNext7Days: boolean;
  lastUpdateTime?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  role: UserRole;
  password?: string;
  photoUrl?: string;
}

export interface Translation {
  title: string;
  welcome: string;
  selectLanguage: string;
  adminLogin: string;
  passengerLogin: string;
  conductorLogin: string;
  register: string;
  login: string;
  busList: string;
  status: string;
  updateStatus: string;
  searchPlaceholder: string;
  voicePrompt: string;
  updatedBy: string;
  feedback: string;
  projectReport: string;
  addBus: string;
  editBus: string;
  deleteBus: string;
  busName: string;
  busNumber: string;
  stops: string;
  save: string;
  cancel: string;
  viewRoute: string;
  howMuchDelay: string;
  mins: string;
  hours: string;
  nameRequired: string;
  phoneRequired: string;
  passRequired: string;
  enterName: string;
  enterPhone: string;
  enterPass: string;
  feedbackSuccess: string;
  confirmDelete: string;
  today: string;
  tomorrow: string;
  next7Days: string;
  manageConductors: string;
  profile: string;
  logout: string;
  uploadPhoto: string;
  lastUpdated: string;
  needAccount: string;
  haveAccount: string;
  saveProfile: string;
}
