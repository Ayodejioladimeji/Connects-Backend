const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground';

const {
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  SENDER_EMAIL_ADDRESS,
} = process.env;

const oauth2Client = new OAuth2(
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  MAILING_SERVICE_REFRESH_TOKEN,
  OAUTH_PLAYGROUND
);

// send mail
const passwordMailer = (to, url, txt) => {
  oauth2Client.setCredentials({
    refresh_token: MAILING_SERVICE_REFRESH_TOKEN,
  });

  const accessToken = oauth2Client.getAccessToken();
  const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: SENDER_EMAIL_ADDRESS,
      clientId: MAILING_SERVICE_CLIENT_ID,
      clientSecret: MAILING_SERVICE_CLIENT_SECRET,
      refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
      accessToken,
    },
  });

  const mailOptions = {
    from: SENDER_EMAIL_ADDRESS,
    to: to,
    subject: 'Connects Chat App',
    html: `
    <div style="max-width: 700px; margin: 0 auto" background:#fff;>
    <div style="text-align: center; padding: 12px">
      <img
        src="https://res.cloudinary.com/mamazee/image/upload/v1640929230/Connects/Group_1_uwle6s.png"
        alt="logo"
        height="120"
        width="150"
      />
    </div>

    <div style="padding: 10px 15px; line-height: 25px">
      <p style="text-align: justify; font-size: 12px; font-family: monospace">
        Hello,
      </p>

      <p style="text-align: left; font-size: 12px; font-family: monospace">
        We received a request to reset the password for the
        <b>Connects Chat App </b> account associated with ${to}. No changes
        has been made to your account yet.<br />
        You can reset your password by clicking the button below.
      </p>

      <div style="text-align: center; margin-top: 40px; margin-bottom: 60px">
        <a href="${url}">
          <button
            style="
              background: #4457e3;
              padding: 15px 50px;
              border: none;
              outline: none;
              color: #fff;
              font-weight: bold;
              cursor: pointer;
              border-radius: 5px;
            "
          >
            ${txt}
          </button>
        </a>
      </div>

      <hr />
      <p style="text-align: center; font-family: monospace">
        If you did not enter this email address when signing up for Connects
        Chat App, kindly disregard this message. Thanks!
      </p>
    </div>
  </div>

        `,
  };

  smtpTransport.sendMail(mailOptions, (err, infor) => {
    if (err) return err;
    return infor;
  });
};

module.exports = passwordMailer;
