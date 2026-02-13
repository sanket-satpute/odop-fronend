export class ContactMessage {
  contactId?: string;
  fullName?: string;
  emailAddress?: string;
  subject?: string;
  message?: string;

  status?: string;  // NEW, IN_PROGRESS, REPLIED, RESOLVED, DELETED
  createdAt?: string;
  updatedAt?: string;

  reply?: string;
  repliedBy?: string;
  repliedAt?: string;
  adminNotes?: string;
}
