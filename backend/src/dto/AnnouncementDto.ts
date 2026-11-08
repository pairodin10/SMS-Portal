import { z } from 'zod';

const announcementFields = {
  title: z.string().trim().min(1, 'Title is required.').max(500),
  body: z.string().trim().min(1, 'Announcement message is required.'),
  status: z.coerce.number().int().refine((value) => value === 0 || value === 1),
};

export const createAnnouncementSchema = z.object({
  ...announcementFields,
  status: announcementFields.status.default(1),
});

export const updateAnnouncementSchema = z.object({
  title: announcementFields.title.optional(),
  body: announcementFields.body.optional(),
  status: announcementFields.status.optional(),
}).refine((data) => Object.keys(data).length > 0, 'At least one field must be provided.');

export const announcementIdSchema = z.coerce.number().int().positive();
