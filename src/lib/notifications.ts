import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_12345");

export async function sendBookingConfirmationEmail(email: string, propertyName: string, startDate: Date, endDate: Date) {
  if (!process.env.RESEND_API_KEY) {
    return;
  }

  try {
    await resend.emails.send({
      from: 'AirbnbClone <onboarding@resend.dev>',
      to: email,
      subject: 'Booking Confirmation',
      html: `<p>Your booking for <strong>${propertyName}</strong> is confirmed!</p>
             <p>Check-in: ${startDate.toDateString()}</p>
             <p>Check-out: ${endDate.toDateString()}</p>`,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
