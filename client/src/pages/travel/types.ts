export interface TravelLog {
  id: number;
  userId: number;
  title: string;
  location: string;
  visitDate: string;
  description: string;
  highlights: string | null;
  imageUrl: string | null;
  isUpcoming: boolean | null;
  createdAt: string | null;
}

export interface TravelFormData {
  title: string;
  location: string;
  visitDate: string;
  description: string;
  highlights: string;
  imageUrl: string;
  isUpcoming: boolean;
}

export const emptyForm: TravelFormData = {
  title: '', location: '', visitDate: '', description: '',
  highlights: '', imageUrl: '', isUpcoming: false,
};

export const LOCATION_GRADIENTS = [
  'from-emerald-900/60 to-teal-900/40',
  'from-blue-900/60 to-indigo-900/40',
  'from-orange-900/60 to-amber-900/40',
  'from-purple-900/60 to-pink-900/40',
  'from-red-900/60 to-rose-900/40',
  'from-cyan-900/60 to-sky-900/40',
];
