import 'multer';
declare global {
  namespace Express {
    interface Request {
      clerkId?: string;
    }
  }
}

export {};