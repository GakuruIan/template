export interface SendVerificationEmailData {
  email: string;
  username: string;
  code: string;
}

export interface EmailData {
  email: string;
  username: string;
  code: string;
}

export interface UserData {
  email: string;
  name: string;
  role: string;
  frontend_url: string;
  employeeCode?: string | null;
}
