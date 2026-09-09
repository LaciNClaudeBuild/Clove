export function magicLinkEmailHtml(url: string) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4ede4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4ede4;">
      <tr>
        <td align="center" style="padding: 48px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 420px; background-color:#fffdf9; border:1px solid #e4d9c9; border-radius:20px;">
            <tr>
              <td align="center" style="padding: 40px 32px 32px;">
                <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 30px; color:#4a3f35; margin-bottom: 10px;">
                  Tender
                </div>
                <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 14px; color:#8a7a6a; margin-bottom: 28px;">
                  Click below to sign in.
                </div>
                <a href="${url}" style="font-family: -apple-system, Helvetica, Arial, sans-serif; background-color:#c97a54; color:#fffdf9; text-decoration:none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 600; display:inline-block;">
                  Sign in to Tender
                </a>
                <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 12px; color:#8a7a6a; margin-top: 28px;">
                  This link expires shortly and can only be used once.<br />
                  If you didn't request this, you can safely ignore this email.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function magicLinkEmailText(url: string) {
  return `Sign in to Tender\n\n${url}\n\nThis link expires shortly and can only be used once. If you didn't request this, you can safely ignore this email.`;
}
