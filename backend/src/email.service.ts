import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// ─── Base Template ────────────────────────────────────────────────────────────
const baseTemplate = (content: string, preheader: string = '') => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nexus Commerce</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; padding: 32px 0; border-bottom: 1px solid #1e1e2e; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .logo span { color: #6366f1; }
    .content { padding: 40px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
    .footer { text-align: center; padding: 24px 0; border-top: 1px solid #1e1e2e; font-size: 13px; color: #666; }
    h1 { font-size: 24px; color: #fff; margin-bottom: 16px; }
    p { line-height: 1.6; color: #aaa; margin-bottom: 12px; }
    .code { background: #1e1e2e; padding: 16px 24px; border-radius: 8px; font-family: monospace; font-size: 24px; letter-spacing: 4px; color: #6366f1; text-align: center; margin: 24px 0; }
    .warning { background: #2a1a1a; border-left: 3px solid #f43f5e; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #f43f5e; margin-top: 24px; }
    .order-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #1e1e2e; }
    .total-row { display: flex; justify-content: space-between; padding: 16px 0; font-weight: 700; color: #fff; font-size: 18px; }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <div class="logo">NEXUS<span>.</span>COMMERCE</div>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>© 2025 Nexus Commerce. Todos os direitos reservados.</p>
      <p style="margin-top:8px">
        <a href="${env.FRONTEND_URL}/unsubscribe" style="color:#666">Descadastrar</a> · 
        <a href="${env.FRONTEND_URL}/privacy" style="color:#666">Privacidade</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// ─── Send Helper ──────────────────────────────────────────────────────────────
const send = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Nexus Commerce" <${env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Email failed to ${to}:`, error);
    throw error;
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────
export const emailService = {
  // Email Verification
  sendEmailVerification: async (to: string, token: string, name?: string | null) => {
    const url = `${env.FRONTEND_URL}/verify-email/${token}`;
    const html = baseTemplate(`
      <h1>Verifique seu email</h1>
      <p>Olá${name ? `, ${name}` : ''}! Bem-vindo à Nexus Commerce.</p>
      <p>Clique no botão abaixo para verificar seu endereço de email e ativar sua conta:</p>
      <div style="text-align:center">
        <a href="${url}" class="btn">Verificar Email</a>
      </div>
      <p>Ou copie e cole este link no navegador:</p>
      <p style="word-break:break-all;color:#6366f1;font-size:13px">${url}</p>
      <div class="warning">Este link expira em 24 horas. Se você não criou uma conta, ignore este email.</div>
    `, 'Confirme seu endereço de email');
    await send(to, 'Verifique seu email — Nexus Commerce', html);
  },

  // Password Reset
  sendPasswordReset: async (to: string, token: string, name?: string | null) => {
    const url = `${env.FRONTEND_URL}/reset-password/${token}`;
    const html = baseTemplate(`
      <h1>Redefinir senha</h1>
      <p>Olá${name ? `, ${name}` : ''}!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique abaixo para criar uma nova senha:</p>
      <div style="text-align:center">
        <a href="${url}" class="btn">Redefinir Senha</a>
      </div>
      <div class="warning">⚠️ Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este email. Sua senha permanece a mesma.</div>
    `, 'Redefina sua senha');
    await send(to, 'Redefinição de senha — Nexus Commerce', html);
  },

  // Order Confirmation
  sendOrderConfirmation: async (to: string, order: {
    orderNumber: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    estimatedDelivery?: string;
  }) => {
    const itemsHtml = order.items.map(item => `
      <div class="order-item">
        <span>${item.name} × ${item.quantity}</span>
        <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    const html = baseTemplate(`
      <h1>Pedido confirmado! 🎉</h1>
      <p>Seu pedido <strong style="color:#6366f1">#${order.orderNumber}</strong> foi confirmado e está sendo processado.</p>
      ${order.estimatedDelivery ? `<p>Previsão de entrega: <strong style="color:#fff">${order.estimatedDelivery}</strong></p>` : ''}
      <div style="background:#1e1e2e;padding:24px;border-radius:12px;margin:24px 0">
        ${itemsHtml}
        <div class="total-row">
          <span>Total</span>
          <span>R$ ${order.total.toFixed(2)}</span>
        </div>
      </div>
      <div style="text-align:center">
        <a href="${env.FRONTEND_URL}/orders/${order.orderNumber}" class="btn">Acompanhar Pedido</a>
      </div>
    `, `Pedido #${order.orderNumber} confirmado`);
    await send(to, `Pedido #${order.orderNumber} confirmado — Nexus Commerce`, html);
  },

  // Order Shipped
  sendOrderShipped: async (to: string, orderNumber: string, trackingCode: string) => {
    const html = baseTemplate(`
      <h1>Seu pedido foi enviado! 🚚</h1>
      <p>Ótimas notícias! Seu pedido <strong style="color:#6366f1">#${orderNumber}</strong> saiu para entrega.</p>
      <div class="code">${trackingCode}</div>
      <p style="text-align:center;font-size:13px">Código de rastreamento</p>
      <div style="text-align:center">
        <a href="${env.FRONTEND_URL}/orders/${orderNumber}" class="btn">Rastrear Pedido</a>
      </div>
    `, 'Seu pedido está a caminho');
    await send(to, `Pedido #${orderNumber} enviado — Nexus Commerce`, html);
  },

  // Abandoned Cart
  sendAbandonedCart: async (to: string, firstName: string, cartItems: Array<{
    name: string; imageUrl: string; price: number;
  }>) => {
    const html = baseTemplate(`
      <h1>Você esqueceu algo! 😮</h1>
      <p>Olá, ${firstName}! Notamos que você deixou alguns itens incríveis no carrinho.</p>
      <p>Eles estão esperando por você:</p>
      <div style="margin:24px 0">
        ${cartItems.slice(0, 3).map(item => `
          <div style="display:flex;align-items:center;gap:16px;padding:12px 0;border-bottom:1px solid #1e1e2e">
            <img src="${item.imageUrl}" alt="${item.name}" style="width:60px;height:60px;border-radius:8px;object-fit:cover">
            <div>
              <p style="color:#fff;margin:0">${item.name}</p>
              <p style="color:#6366f1;margin:4px 0 0">R$ ${item.price.toFixed(2)}</p>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center">
        <a href="${env.FRONTEND_URL}/cart" class="btn">Finalizar Compra</a>
      </div>
    `, 'Seu carrinho está esperando');
    await send(to, 'Você esqueceu itens no carrinho — Nexus Commerce', html);
  },

  // New Ticket Reply
  sendTicketReply: async (to: string, ticketNumber: string, staffMessage: string) => {
    const html = baseTemplate(`
      <h1>Resposta no seu ticket</h1>
      <p>O ticket <strong style="color:#6366f1">#${ticketNumber}</strong> recebeu uma nova resposta da nossa equipe:</p>
      <div style="background:#1e1e2e;padding:20px;border-radius:8px;border-left:3px solid #6366f1;margin:24px 0">
        <p style="color:#e0e0e0">${staffMessage}</p>
      </div>
      <div style="text-align:center">
        <a href="${env.FRONTEND_URL}/support/tickets/${ticketNumber}" class="btn">Ver Ticket</a>
      </div>
    `, 'Nova resposta no seu ticket de suporte');
    await send(to, `Resposta no ticket #${ticketNumber} — Nexus Commerce`, html);
  },

  // Welcome (after email verification)
  sendWelcome: async (to: string, firstName: string) => {
    const html = baseTemplate(`
      <h1>Bem-vindo à Nexus Commerce! 🚀</h1>
      <p>Olá, ${firstName}! Sua conta foi verificada com sucesso.</p>
      <p>Você agora tem acesso a:</p>
      <ul style="list-style:none;padding:0;margin:16px 0">
        <li style="padding:8px 0;color:#aaa">✅ Catálogo completo de produtos</li>
        <li style="padding:8px 0;color:#aaa">✅ Checkout rápido e seguro</li>
        <li style="padding:8px 0;color:#aaa">✅ Rastreamento de pedidos em tempo real</li>
        <li style="padding:8px 0;color:#aaa">✅ Suporte prioritário</li>
      </ul>
      <div style="text-align:center">
        <a href="${env.FRONTEND_URL}/shop" class="btn">Explorar Loja</a>
      </div>
    `, 'Sua conta está ativa!');
    await send(to, 'Bem-vindo à Nexus Commerce!', html);
  },
};
