import { Resend } from "resend";
import { formatWibDate, formatWibDateTime } from "./date-standards";
import { formatPrice } from "./format";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey || "re_dummy_key");
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Ruang Rehat <onboarding@resend.dev>";

export interface HostNewBookingEmailParams {
  hostEmail: string;
  hostName?: string | null;
  propertyName: string;
  startDate: Date | string;
  endDate: Date | string;
  guestName: string;
  guestsCount?: number;
  totalNights: number;
  netHostPayoutIdr: number;
  bookingId: string;
}

export interface HostPayoutApprovedEmailParams {
  hostEmail: string;
  hostName?: string | null;
  amountIdr: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  referenceNumber?: string | null;
  payoutId: string;
  processedAt?: Date | string;
}

/**
 * Mengirim email konfirmasi pemesanan kepada Tamu (Guest)
 */
export async function sendBookingConfirmationEmail(
  email: string,
  propertyName: string,
  startDate: Date | string,
  endDate: Date | string
) {
  if (!resendApiKey || resendApiKey.startsWith("re_dummy")) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Email Mock] Konfirmasi pesanan untuk tamu disimulasikan ke: ${email}`
      );
    }
    return;
  }

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `[Ruang Rehat] Konfirmasi Pemesanan: ${propertyName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Ruang Rehat</h1>
      <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;">E-Voucher & Konfirmasi Tiket Menginap</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin-top: 0;">Pemesanan Anda untuk <strong>${propertyName}</strong> telah terkonfirmasi.</p>
      <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Jadwal Check-in:</strong> ${formatWibDate(startDate)} (14:00 WIB)</p>
        <p style="margin: 0; font-size: 14px;"><strong>Jadwal Check-out:</strong> ${formatWibDate(endDate)} (12:00 WIB)</p>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Anda dapat melihat e-voucher resmi lengkap dan instruksi check-in melalui dashboard akun Anda.</p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} Ruang Rehat Indonesia.
    </div>
  </div>
</body>
</html>`,
    });
  } catch (error) {
    console.error("[sendBookingConfirmationEmail Error]:", error);
  }
}

/**
 * Mengirim notifikasi email kepada Host saat tamu berhasil menyelesaikan pembayaran pesanan.
 */
export async function sendHostNewBookingEmail(
  params: HostNewBookingEmailParams
) {
  if (!resendApiKey || resendApiKey.startsWith("re_dummy")) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Email Mock] Notifikasi pesanan baru host disimulasikan ke: ${params.hostEmail} (${params.propertyName})`
      );
    }
    return;
  }

  try {
    const bookingCode = params.bookingId.slice(-8).toUpperCase();
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.hostEmail,
      subject: `[Ruang Rehat] Pesanan Baru Masuk (#${bookingCode}): ${params.propertyName}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Ruang Rehat</h1>
      <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 13px;">Notifikasi Reservasi Unit Tuan Rumah</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin-top: 0;">Halo <strong>${params.hostName || "Mitra Host"}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Kabar baik! Unit properti Anda baru saja dipesan dan pembayaran telah diselesaikan oleh tamu.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
          Rincian Reservasi (#${bookingCode})
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Unit Properti:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.propertyName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Nama Tamu:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.guestName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Kapasitas Tamu:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.guestsCount || 1} Orang</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Durasi Menginap:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.totalNights} Malam</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Jadwal Check-in:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${formatWibDate(params.startDate)} (14:00 WIB)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Jadwal Check-out:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${formatWibDate(params.endDate)} (12:00 WIB)</td>
          </tr>
          <tr style="border-top: 1px dashed #cbd5e1;">
            <td style="padding: 12px 0 0 0; color: #0f172a; font-weight: 700;">Estimasi Bersih Host:</td>
            <td style="padding: 12px 0 0 0; text-align: right; font-weight: 800; font-size: 15px; color: #059669;">
              ${formatPrice(params.netHostPayoutIdr, "IDR")}
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #065f46; line-height: 1.5;">
          <strong>Garansi Escrow Ruang Rehat:</strong> Dana sewa bersih Anda dijamin aman di rekening penampungan dan akan otomatis dilepaskan (RELEASED) ke saldo penarikan 24 jam setelah jadwal check-in resmi (H+1 14:00 WIB).
        </p>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        Silakan periksa detail pesanan dan hubungi tamu bila diperlukan melalui Dasbor Host Ruang Rehat.
      </p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Ruang Rehat Indonesia. Notifikasi Otomatis Sistem.</p>
      <p style="margin: 4px 0 0 0;">Anda menerima email ini karena opsi notifikasi pemesanan host aktif di akun Anda.</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (error) {
    console.error("[sendHostNewBookingEmail Error]:", error);
  }
}

/**
 * Mengirim notifikasi email kepada Host saat Admin menyetujui dan memproses pencairan dana (Payout COMPLETED).
 */
export async function sendHostPayoutApprovedEmail(
  params: HostPayoutApprovedEmailParams
) {
  if (!resendApiKey || resendApiKey.startsWith("re_dummy")) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Email Mock] Konfirmasi pencairan dana host disimulasikan ke: ${params.hostEmail} (${params.amountIdr} IDR)`
      );
    }
    return;
  }

  try {
    const payoutCode = params.payoutId.slice(-8).toUpperCase();
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.hostEmail,
      subject: `[Ruang Rehat] Pencairan Saldo Berhasil Disetujui: ${formatPrice(params.amountIdr, "IDR")}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Ruang Rehat</h1>
      <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 13px;">Bukti Pencairan Dana (Payout Disbursement)</p>
    </div>
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; margin-top: 0;">Halo <strong>${params.hostName || "Mitra Host"}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Permintaan penarikan saldo sewa Anda telah disetujui dan berhasil ditransfer oleh tim keuangan Ruang Rehat.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
          Rincian Mutasi Transfer (#${payoutCode})
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Nominal Ditransfer:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 800; font-size: 15px; color: #059669;">
              ${formatPrice(params.amountIdr, "IDR")}
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Bank Tujuan:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.bankName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Nomor Rekening:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.accountNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Nama Pemilik:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">${params.accountHolder}</td>
          </tr>
          ${
            params.referenceNumber
              ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;">No. Ref / Mutasi Bank:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #2563eb;">${params.referenceNumber}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Waktu Diproses:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #0f172a;">
              ${formatWibDateTime(params.processedAt || new Date())}
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 24px;">
        Silakan periksa mutasi rekening penerima Anda. Waktu efektif masuknya dana dapat berbeda tergantung pada jaringan perbankan (BI-FAST atau Realtime Online).
      </p>
    </div>
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Ruang Rehat Indonesia. Layanan Keuangan Mitra.</p>
      <p style="margin: 4px 0 0 0;">Anda menerima email ini karena opsi notifikasi pencairan dana sewa host aktif di akun Anda.</p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch (error) {
    console.error("[sendHostPayoutApprovedEmail Error]:", error);
  }
}
