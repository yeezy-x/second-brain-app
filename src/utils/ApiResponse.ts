export class ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;

  constructor(data: T, message?: string, meta?: any) {
    this.success = true;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }
}