import nodemailer from "nodemailer";

// Strict parsing for production deployment
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "InternFlow Verify <noreply@internflow.com>";

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: SMTP_USER ? {
    user: SMTP_USER,
    pass: SMTP_PASS,
  } : undefined, // Graceful fallback if auth is entirely missing
});

/**
 * Validates the email transport configuration. Call this on server start if needed.
 */
export async function verifyEmailSetup() {
  if (!SMTP_USER) {
    console.warn("⚠️ [SMTP Warning] SMTP_USER is not configured. Emails will be logged to console.");
    return false;
  }
  try {
    await transporter.verify();
    console.log("✅ [SMTP Ready] Mail server connection established.");
    return true;
  } catch (error) {
    console.error("❌ [SMTP Error] Failed to connect to mail server:", error);
    return false;
  }
}

/**
 * Mail Generator Function for Company Result Verification
 * Sends an email containing the custom verification code.
 */
export async function sendCompanyResultEmail(
  toEmail: string,
  studentName: string,
  companyName: string,
  jobRole: string,
  verificationCode: string
) {
  try {
    const htmlTemplate = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4F46E5; margin-bottom: 0;">InternFlow Selection</h2>
        </div>
        <p style="color: #333333; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color: #555555; font-size: 15px; line-height: 1.5;">
          Congratulations! You have been successfully shortlisted for the role of <strong>${jobRole}</strong> at <strong>${companyName}</strong>.
        </p>
        
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #6B7280; margin-bottom: 8px;">Your Verification Code</p>
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #111827;">${verificationCode}</h1>
        </div>

        <p style="color: #555555; font-size: 15px; line-height: 1.5;">
          To proceed, please log in to your InternFlow Student Dashboard. You must enter this verification code to initiate your official On-Duty (OD) Request flow.
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.5; margin-top: 30px;">
          Best Regards,<br />
          <strong>Rathinam Placement Cell</strong>
        </p>
      </div>
    `;

    if (SMTP_USER && SMTP_PASS) {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: `Internship Selection: ${companyName} (${jobRole})`,
        html: htmlTemplate,
      });
      console.log(`[Mail Gateway] Verification email dispatched to ${toEmail}`);
    } else {
      console.log(`\n=========================================\n[Mail Gateway - DEV MODE] \nIntended For: ${toEmail}\nCode: ${verificationCode}\n=========================================\n`);
    }
    return { success: true };
  } catch (error) {
    console.error("[Mail Gateway Error]:", error);
    return { success: false, error };
  }
}

/**
 * SMS Gateway Stub
 * Can be hooked into Twilio, MSG91, or Fast2SMS.
 */
export async function sendVerificationSMS(phoneNumber: string, verificationCode: string) {
  try {
    const TWILIO_SID = process.env.TWILIO_SID;
    const TWILIO_AUTH = process.env.TWILIO_AUTH;
    const TWILIO_PHONE = process.env.TWILIO_PHONE;
    
    if (TWILIO_SID && TWILIO_AUTH && TWILIO_PHONE) {
      console.log(`[SMS Gateway] Sending SMS to ${phoneNumber} via Twilio`);
      
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      const token = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString("base64");
      
      const params = new URLSearchParams({
        To: phoneNumber,
        From: TWILIO_PHONE,
        Body: `Your InternFlow verification code is ${verificationCode}`
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[SMS Gateway Twilio Error]:", errorData);
        return { success: false, error: errorData };
      }
      
      console.log(`[SMS Gateway] SMS successfully dispatched to ${phoneNumber}`);
    } else {
      console.log(`\n=========================================\n[SMS Gateway - DEV MODE] \nIntended Phone: ${phoneNumber}\nMessage: Your InternFlow code is ${verificationCode}\n=========================================\n`);
    }
    return { success: true };
  } catch (error) {
    console.error("[SMS Gateway Error]:", error);
    return { success: false, error };
  }
}

/**
 * Mail Generator Function for Company Approval
 * Sends an email containing the temporary password for the CEO/HR.
 */
export async function sendCompanyApprovalEmail(
  toEmail: string,
  companyName: string,
  tempPassword: string
) {
  try {
    const htmlTemplate = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4F46E5; margin-bottom: 0;">InternFlow Onboarding</h2>
        </div>
        <p style="color: #333333; font-size: 16px;">Dear <strong>${companyName}</strong> Team,</p>
        <p style="color: #555555; font-size: 15px; line-height: 1.5;">
          Congratulations! Your registration on the InternFlow platform has been approved. You can now log in and start posting internship opportunities.
        </p>
        
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #6B7280; margin-bottom: 8px;">Your Temporary Password</p>
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; color: #111827;">${tempPassword}</h1>
        </div>

        <p style="color: #555555; font-size: 15px; line-height: 1.5;">
          Please log in using this email address (<strong>${toEmail}</strong>) and the temporary password above. We highly recommend changing your password immediately after your first login.
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.5; margin-top: 30px;">
          Best Regards,<br />
          <strong>Rathinam Placement Cell</strong>
        </p>
      </div>
    `;

    if (SMTP_USER && SMTP_PASS) {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: `InternFlow Registration Approved - ${companyName}`,
        html: htmlTemplate,
      });
      console.log(`[Mail Gateway] Approval email dispatched to ${toEmail}`);
    } else {
      console.log(`\n=========================================\n[Mail Gateway - DEV MODE] \nIntended For: ${toEmail}\nPassword: ${tempPassword}\n=========================================\n`);
    }
    return { success: true };
  } catch (error) {
    console.error("[Mail Gateway Error]:", error);
    return { success: false, error };
  }
}
