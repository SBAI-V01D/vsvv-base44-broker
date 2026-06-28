declare module 'nodemailer' {
  import { EventEmitter } from 'events';

  interface SendMailOptions {
    from?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename?: string;
      content?: string | Buffer;
      path?: string;
      contentType?: string;
    }>;
  }

  interface SentMessageInfo {
    messageId: string;
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
  }

  interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
    close(): void;
  }

  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
  }

  export function createTransport(transport: TransportOptions): Transporter;
  export function createTransport(
    transport: string | TransportOptions,
    defaults?: Partial<TransportOptions>,
  ): Transporter;
}
