import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: error.issues.map((issue) => issue.message).join(' '),
    });
    return;
  }

  if (error.message === 'Invalid credentials' || error.message === 'Account is inactive') {
    res.status(401).json({ success: false, message: error.message });
    return;
  }

  if (error.message === 'User already exists') {
    res.status(409).json({ success: false, message: error.message });
    return;
  }

  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
};
