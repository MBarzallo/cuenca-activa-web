export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  path: string;
  details: unknown;
  timestamp: string;
}

