import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter: nodemailer.Transporter | null = null;

export function initEmailTransporter() {
  if (!config.email?.host) {
    console.log("[邮件] 未配置邮件服务，跳过初始化");
    return;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port || 587,
    secure: config.email.secure || false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  console.log("[邮件] 邮件服务已初始化");
}

export async function sendAlertEmail(
  to: string,
  alert: {
    message: string
    monitorTerm?: { word: string }
    news?: { title: string; url: string; source: string }
  }
): Promise<boolean> {
  if (!transporter || !config.email?.enabled) {
    console.log("[邮件] 邮件服务未启用或未配置");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"AI Trend Monitor" <${config.email.from || config.email.user}>`,
      to,
      subject: `【热点告警】${alert.monitorTerm?.word || "监控词"} - ${alert.news?.title?.substring(0, 30) || "新告警"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">🔥 热点告警通知</h2>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>监控词：</strong>${alert.monitorTerm?.word || "未知"}</p>
            <p style="margin: 0 0 10px 0;"><strong>相关新闻：</strong>${alert.news?.title || "未知"}</p>
            <p style="margin: 0 0 10px 0;"><strong>来源：</strong>${alert.news?.source || "未知"}</p>
            <p style="margin: 0 0 10px 0;"><strong>时间：</strong>${new Date().toLocaleString("zh-CN")}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            ${alert.message}
          </p>
          ${
            alert.news?.url
              ? `<p style="margin-top: 20px;">
            <a href="${alert.news.url}" style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px;">查看原文</a>
          </p>`
              : ""
          }
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            此邮件由 AI Trend Monitor 自动发送，请勿回复。
          </p>
        </div>
      `,
    });

    console.log(`[邮件] 发送成功: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[邮件] 发送失败:", (error as Error).message);
    return false;
  }
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<boolean> {
  if (!transporter || !config.email?.enabled) {
    console.log("[邮件] 邮件服务未启用或未配置");
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"AI Trend Monitor" <${config.email.from || config.email.user}>`,
      to,
      subject: "【AI Trend Monitor】邮箱验证码",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">验证您的邮箱地址</h2>
          <p style="font-size: 16px; color: #374151;">
            请使用以下验证码完成邮箱绑定：
          </p>
          <div style="background: #f3f4f6; padding: 30px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            验证码有效期为 10 分钟，请勿泄露给他人。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            此邮件由 AI Trend Monitor 自动发送，请勿回复。
          </p>
        </div>
      `,
    });

    console.log(`[邮件] 验证码发送成功: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[邮件] 验证码发送失败:", (error as Error).message);
    return false;
  }
}
