import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import { errorResponse } from "../../Types/error";
import { EmailOtpRedisCache } from "../cache/redis/emailOtp";

const redisCache = new EmailOtpRedisCache();

let transporter = nodemailer.createTransport({
  host: "mail.sweaven.dev",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "auth@sweaven.dev", // generated ethereal user
    pass: "]_kti~_ImkAJ", // generated ethereal password
  },
});

export async function sendEmailOtp(email: string) {
  email = email.toLowerCase();
  const generatedCode: string = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    specialChars: false,
    upperCaseAlphabets: false
  });
  try {

    await transporter.sendMail({
      from: '"ticket-master-authentication 👻" <auth@sweaven.dev', // sender address
      to: `${email}`,
      subject: `${generatedCode}`,
      html: emailHtml(generatedCode),
    });
    await redisCache.addEmailOtp(email, generatedCode, 3600);
    return generatedCode;

  } catch (error: any) {
    console.log("[-] sendOtpEmail error ", error);
    const _err: errorResponse = {
      msg: error.message ?? "Could not connect to Email service",
      statusCode: 500,
      type: "EmailOtp"
    }
    throw _err;
  }
}

export async function verifyEmailOtp(email: string, otp: string) {
  try {
    email = email.toLowerCase();
    const fetchedOTP = await redisCache.getEmailOtp(email)
    if (fetchedOTP == undefined) throw Error("E-mail OTP cannot be found in database");

    if (fetchedOTP === otp.toString()) {
      await redisCache.removeEmailOtp(email)
      return { email, code: otp, status: true }
    }
    throw Error("Email OTP verification failed")

  } catch (error: any) {
    console.log("[-] verifyEmailOtp error ", error);
    const _err: errorResponse = {
      msg: error.message ?? "Could not connect to Email service",
      statusCode: 500,
      type: "EmailOtp"
    }
    throw _err;
  }

}

function emailHtml(generatedCode: string) {
  return `<tbody>
    <tbody>
  <tr>
    <td style="font-family: Verdana, sans-serif; background-color: #f0f7f0; padding: 20px;">
      <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #0E9F6E;">
        <tr>
          <td style="background-color: #0E9F6E; color: white; text-align: center; padding: 15px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Agelgil Security Code</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; color: #0E9F6E;">
            <p style="margin-bottom: 15px;">Hi,</p>
            <p style="margin-bottom: 15px;">
              Here is a temporary security code for your <strong>Agelgil</strong> account. It can only be used once within the next <strong>4 minutes</strong>, after which it will expire:
            </p>
            <p style="font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #0E9F6E;">${generatedCode}</p>
            <p style="margin-bottom: 15px;">
              If you did not request a verification code, your <strong>Agelgil</strong> account may be compromised. Please 
              <a href="https://tracking.Agelgil.com/CL0/https:%2F%2Faccount.Agelgil.com%2Fen-US%2Fsecurity-settings/1/010001841faef37d-c20488a4-b30e-4fa4-9e7f-606b667d8f92-000000/ihKv13KNrvfs8QMB_KmMN4Yx57IuCzuePTLiiSpcSmA=272" target="_blank" style="color: #0E9F6E; text-decoration: underline;">
                change your password
              </a>
              as soon as possible.
            </p>
            <p style="margin-bottom: 15px;">Sincerely,</p>
            <p style="margin-bottom: 15px;"><strong>Your Agelgil Team</strong></p>
          </td>
        </tr>
        <tr>
          <td style="text-align: center; padding: 10px; font-size: 12px; color: #666666;">
            © 2024 Agelgil. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</tbody>

    `
}
export class EmailService {

  private transporter;
  private redisCache;

  private host;
  private port;
  private secure = false;
  private user;
  private pass;

  constructor({ host, port, user, pass }: { host: string, port: number, user: string, pass: string }) {

    this.host = host ?? process.env.EMAIL_HOST ?? "";
    this.port = port ?? parseInt(process.env.EMAIL_PORT ?? '-1') ?? -1;
    if (this.port == 465) this.secure = true;
    this.user = user ?? process.env.EMAIL_USER ?? "";
    this.pass = pass ?? process.env.EMAIL_PASS ?? "";

    this.transporter = nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: true,
      auth: {
        user: this.user,
        pass: this.pass,
      },
    });

    this.redisCache = new EmailOtpRedisCache();
  }

  public async sendEmailOtp(email: string, { from = '"ticket-master-authentication 👻" <auth@sweaven.dev>' }: { from?: string }): Promise<string> {
    email = email.toLowerCase();

    const generatedCode: string = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false
    });

    try {
      await this.transporter.sendMail({
        from,
        to: `${email}`,
        subject: `${generatedCode}`,
        html: this.emailHtml(generatedCode),
      });

      await this.redisCache.addEmailOtp(email, generatedCode, 3600);
      return generatedCode;

    } catch (error: any) {
      console.log("[-] sendOtpEmail error ", error);
      const _err: errorResponse = {
        msg: error.message ?? "Could not connect to Email service",
        statusCode: 500,
        type: "EmailOtp"
      }
      throw _err;
    }
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<{ email: string, code: string, status: boolean }> {
    try {
      email = email.toLowerCase();
      const fetchedOTP = await this.redisCache.getEmailOtp(email);
      if (fetchedOTP == undefined) throw Error("E-mail OTP cannot be found in database");

      if (fetchedOTP === otp.toString()) {
        await this.redisCache.removeEmailOtp(email);
        return { email, code: otp, status: true };
      }
      throw Error("Email OTP verification failed");

    } catch (error: any) {
      console.log("[-] verifyEmailOtp error ", error);
      const _err: errorResponse = {
        msg: error.message ?? "Could not connect to Email service",
        statusCode: 500,
        type: "EmailOtp"
      }
      throw _err;
    }
  }

  private emailHtml(generatedCode: string): string {
    return `
        <tbody>
            <tr>
                <td style="font-family: Verdana, sans-serif; background-color: #f0f7f0; padding: 20px;">
                    <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #0E9F6E;">
                        <tr>
                            <td style="background-color: #0E9F6E; color: white; text-align: center; padding: 15px; border-radius: 8px 8px 0 0;">
                                <h2 style="margin: 0;">Agelgil Security Code</h2>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 20px; color: #0E9F6E;">
                                <p style="margin-bottom: 15px;">Hi,</p>
                                <p style="margin-bottom: 15px;">
                                    Here is a temporary security code for your <strong>Agelgil</strong> account. It can only be used once within the next <strong>4 minutes</strong>, after which it will expire:
                                </p>
                                <p style="font-size: 24px; font-weight: bold; margin-bottom: 15px; color: #0E9F6E;">${generatedCode}</p>
                                <p style="margin-bottom: 15px;">
                                    If you did not request a verification code, your <strong>Agelgil</strong> account may be compromised. Please 
                                    <a href="https://tracking.Agelgil.com/CL0/https:%2F%2Faccount.Agelgil.com%2Fen-US%2Fsecurity-settings/1/010001841faef37d-c20488a4-b30e-4fa4-9e7f-606b667d8f92-000000/ihKv13KNrvfs8QMB_KmMN4Yx57IuCzuePTLiiSpcSmA=272" target="_blank" style="color: #0E9F6E; text-decoration: underline;">
                                        change your password
                                    </a>
                                    as soon as possible.
                                </p>
                                <p style="margin-bottom: 15px;">Sincerely,</p>
                                <p style="margin-bottom: 15px;"><strong>Your Agelgil Team</strong></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; padding: 10px; font-size: 12px; color: #666666;">
                                © 2024 Agelgil. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </tbody>
        `;
  }
}

export default EmailService;