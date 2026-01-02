const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'tusharelectronics8439@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

// Send inquiry email to admin
const sendInquiryEmail = async (inquiryData) => {
  try {
    const productList =
      inquiryData.product_ids && inquiryData.product_ids.length > 0
        ? inquiryData.product_ids
            .map((p) => `- ${p.name || 'Product'}`)
            .join('\n')
        : 'General inquiry (no specific products)';

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'tusharelectronics8439@gmail.com',
      to: 'tusharelectronics8439@gmail.com',
      subject: `New Product Inquiry from ${inquiryData.name}`,
      html: `
        <h2>New Product Inquiry</h2>
        <p><strong>Name:</strong> ${inquiryData.name}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Phone:</strong> <a href="tel:${inquiryData.phone}">${inquiryData.phone}</a></p>
        <p><strong>Products:</strong></p>
        <pre>${productList}</pre>
        <p><strong>Message:</strong></p>
        <p>${inquiryData.message || 'No message provided'}</p>
        <hr>
        <p><strong>Contact Customer:</strong> <a href="tel:${inquiryData.phone}">${inquiryData.phone}</a> | <a href="mailto:${inquiryData.email}">${inquiryData.email}</a></p>
        <p><small>Received at: ${new Date().toLocaleString()}</small></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending inquiry email:', error);
    return false;
  }
};

// Send auto-reply to customer
const sendAutoReply = async (
  customerEmail,
  customerName,
  productDetails = null
) => {
  try {
    let productInfo = '';
    if (productDetails) {
      productInfo = `
        <h3>Product Details:</h3>
        <pre>${productDetails}</pre>
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'tusharelectronics8439@gmail.com',
      to: customerEmail,
      subject: 'Thank you for your inquiry - Tushar Electronics',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #e0e7ef 0%, #f7fafc 100%); padding: 16px 0;">
          <div style="max-width: 98vw; width: 100%; min-width: 0; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px #b6c6e6; padding: 18px 4vw 18px 4vw; border: 1.5px solid #e0e7ef; box-sizing: border-box;">
            <div style="text-align:center; margin-bottom: 20px;">
              <img src="https://tusharagro.com/logo/Logo1.png" alt="Tushar Electronics Logo" style="width: 56px; height: 56px; border-radius: 10px; box-shadow: 0 2px 8px #b6c6e6; margin-bottom: 8px;">
              <h2 style="color: #1e293b; margin: 0; font-size: 1.25rem; letter-spacing: 0.5px; font-weight: 700; line-height: 1.3;">Thank you for contacting<br>
                <span style='color:#FFD600; font-weight:900; text-shadow:0 2px 8px #ffec80,0 1px 0 #bfa700; display:inline-block; animation: glow 1.2s ease-in-out infinite alternate;'>Tushar Electronics</span>!
              </h2>
              <style>
                @keyframes glow {
                  0% { text-shadow: 0 2px 8px #ffec80, 0 1px 0 #bfa700; }
                  100% { text-shadow: 0 4px 16px #ffe066, 0 2px 4px #bfa700; }
                }
              </style>
            </div>
            <p style="font-size: 1rem; color: #222; margin-bottom: 8px; line-height:1.5;">Dear <strong>${customerName}</strong>,</p>
            <p style="color: #444; margin-bottom: 14px; font-size:0.97rem; line-height:1.5;">We have received your inquiry and our team will get back to you shortly.</p>
            <div style="background: #f1f5fb; border-radius: 8px; padding: 12px 4vw; margin-bottom: 14px; font-size:0.97rem; line-height:1.5; word-break:break-word;">
              ${productInfo}
            </div>
            <h3 style="color: #2563eb; margin-top: 24px; font-size: 1.05rem;"><span style='font-size:1.1em;'>📦</span> What Happens Next?</h3>
            <p style="color: #444; margin-bottom: 14px; font-size:0.97rem; line-height:1.5;"><span style='font-size:1.1em;'>⏳</span> Our team will review your inquiry and respond with detailed information about availability, pricing, and any specific requirements you mentioned. If you have questions about warranty, shipping, or installation, please let us know so we can address them in our reply.</p>
            <h3 style="color: #2563eb; margin-top: 24px; font-size: 1.05rem;"><span style='font-size:1.1em;'>💡</span> Why Choose Tushar Electronics?</h3>
            <ul style="color: #444; padding-left: 18px; margin-bottom: 14px; font-size:0.97rem; line-height:1.5;">
              <li><span style='font-size:1.1em;'>✅</span> All products are designed for reliability and tested for quality.</li>
              <li><span style='font-size:1.1em;'>🔄</span> We offer clear warranty and return policies.</li>
              <li><span style='font-size:1.1em;'>🤝</span> Our support team is available for any questions before and after your purchase.</li>
            </ul>
            <div style="background: rgba(255, 236, 128, 0.82); border-radius: 8px; padding: 10px 4vw; margin: 24px 0 14px 0; text-align:center; color: #7a5c00; font-size:0.89rem; line-height:1.5; border: 1px solid #ffe066; box-shadow: 0 2px 8px #fffbe6;">
              <h3 style="margin:0 0 6px 0; font-size:0.98rem; font-weight:600; letter-spacing:0.5px; color:#bfa700;"><span style='font-size:1.1em;'>📞</span> Contact Information</h3>
              <p style="margin: 0; font-size: 0.89rem; color:#7a5c00;">
                <span style='font-size:1.1em;'>✉️</span> <strong>Email:</strong> <a href="mailto:tusharelectronics8439@gmail.com" style="color:#7a5c00; text-decoration:underline;">tusharelectronics8439@gmail.com</a><br>
                <span style='font-size:1.1em;'>📱</span> <strong>Phone:</strong> <a href="tel:+919171310766" style="color:#7a5c00; text-decoration:underline;">+91 9171310766</a><br>
                <span style='font-size:1.1em;'>🌐</span> <strong>Website:</strong> <a href="https://tusharagro.com" style="color:#7a5c00; text-decoration:underline;">tusharagro.com</a>
              </p>
            </div>
            <div style="margin-top: 16px; text-align:center;">
              <p style="margin: 0; color: #222; font-weight: 500; font-size: 0.97rem;"><span style='font-size:1.1em;'>🙏</span> Best regards,<br>Tushar Electronics Team</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending auto-reply:', error);
    return false;
  }
};

module.exports = { sendInquiryEmail, sendAutoReply };
