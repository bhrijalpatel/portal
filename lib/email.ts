import { Resend } from "resend";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || "Portal <noreply@example.com>";
const APP_NAME = process.env.APP_NAME || "Portal";
// APP_URL is defined but not used in this file - commented out to fix linting
// const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Send verification email using Resend
 */
export async function sendVerificationEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Verify your email for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #4f46e5, #7c3aed); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${APP_NAME}!</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Verify your email address</h2>
              
              <p style="color: #6b7280; margin: 20px 0;">
                Thanks for signing up! Please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #6b7280;">
                ${url}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                This verification link will expire in 24 hours for security reasons.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to ${APP_NAME}!
        
        Please verify your email address by clicking the link below:
        ${url}
        
        If you didn't create an account with ${APP_NAME}, you can safely ignore this email.
        
        This verification link will expire in 24 hours.
      `,
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

/**
 * Send password reset email using Resend
 */
export async function sendPasswordResetEmail({
  to,
  url,
}: {
  to: string;
  url: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Reset your password for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(to right, #dc2626, #ef4444); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">Reset your password</h2>
              
              <p style="color: #6b7280; margin: 20px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #6b7280;">
                ${url}
              </p>
              
              <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0; font-weight: bold;">
                  ⚠️ Security Notice
                </p>
                <p style="color: #7f1d1d; margin: 5px 0 0; font-size: 14px;">
                  If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This password reset link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">
                For security, this request was received from IP address: ${
                  process.env.NODE_ENV === "production"
                    ? "[Hidden for privacy]"
                    : "localhost"
                }.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request for ${APP_NAME}
        
        We received a request to reset your password. Click the link below to create a new password:
        ${url}
        
        If you didn't request this password reset, please ignore this email and your password will remain unchanged.
        
        This password reset link will expire in 1 hour.
        
        For security, this request was received from IP address: ${
          process.env.NODE_ENV === "production"
            ? "[Hidden for privacy]"
            : "localhost"
        }.
      `,
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

/**
 * Send general email using Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    // Resend requires either html or text, not both undefined
    if (!html && !text) {
      throw new Error("Either html or text content must be provided");
    }

    // Ensure we always have text content
    const finalText =
      text ||
      (html
        ? `This email requires HTML support. Please view it in a modern email client.`
        : "");

    const emailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      text: finalText,
      ...(html && { html }),
    };

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error("Failed to send email:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
