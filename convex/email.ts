import { internalAction } from "./_generated/server";
import { v } from "convex/values";

const FROM = "Minerva OS <hello@minervaos.app>";

async function resendSend(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error: ${await res.text()}`);
}

export const sendInvoice = internalAction({
  args: {
    to: v.string(),
    invoiceNumber: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    workspaceName: v.string(),
  },
  handler: async (_ctx, args) => {
    await resendSend(
      args.to,
      `Invoice ${args.invoiceNumber} from ${args.workspaceName}`,
      `<p>You have a new invoice <strong>${args.invoiceNumber}</strong> for <strong>$${args.amount}</strong> due on <strong>${args.dueDate}</strong>.</p><p>Thank you,<br>${args.workspaceName}</p>`,
    );
  },
});

export const sendProposal = internalAction({
  args: {
    to: v.string(),
    title: v.string(),
    proposalUrl: v.string(),
    workspaceName: v.string(),
  },
  handler: async (_ctx, args) => {
    await resendSend(
      args.to,
      `Proposal: ${args.title}`,
      `<p>Please review your proposal <strong>${args.title}</strong>.</p><p><a href="${args.proposalUrl}">View Proposal</a></p><p>Thank you,<br>${args.workspaceName}</p>`,
    );
  },
});

export const sendPasswordReset = internalAction({
  args: {
    to: v.string(),
    resetUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    await resendSend(
      args.to,
      "Reset your Minerva OS password",
      `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${args.resetUrl}">Reset Password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
    );
  },
});

export const sendInvitation = internalAction({
  args: {
    to: v.string(),
    workspaceName: v.string(),
    inviteUrl: v.string(),
    role: v.string(),
  },
  handler: async (_ctx, args) => {
    await resendSend(
      args.to,
      `You have been invited to ${args.workspaceName}`,
      `<p>You have been invited to join <strong>${args.workspaceName}</strong> as a <strong>${args.role}</strong>.</p><p><a href="${args.inviteUrl}">Accept Invitation</a></p><p>This invitation expires in 7 days.</p>`,
    );
  },
});

export const sendWelcome = internalAction({
  args: {
    to: v.string(),
    workspaceName: v.string(),
  },
  handler: async (_ctx, args) => {
    await resendSend(
      args.to,
      `Welcome to ${args.workspaceName} on Minerva OS`,
      `<p>Your workspace <strong>${args.workspaceName}</strong> is ready. Log in to get started.</p><p>The Minerva OS team</p>`,
    );
  },
});

export const sendRiskAlert = internalAction({
  args: {
    to: v.string(),
    projectName: v.string(),
    riskSummary: v.string(),
  },
  handler: async (_ctx, args) => {
    await resendSend(
      args.to,
      `Risk Alert: ${args.projectName}`,
      `<p>A risk has been detected on project <strong>${args.projectName}</strong>:</p><blockquote>${args.riskSummary}</blockquote><p>Please review and take action in Minerva OS.</p>`,
    );
  },
});
