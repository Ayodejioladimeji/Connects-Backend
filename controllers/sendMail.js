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
const sendEmail = (to, username, url, txt) => {
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
    
    <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <div style="max-width: 700px; margin: 0 auto" background:#fff;>
      <div style="text-align: center; padding: 12px">
        <img
          src="https://res.cloudinary.com/mamazee/image/upload/v1640929230/Connects/Group_1_uwle6s.png"
          alt="logo"
          height="120"
          width="150"
        />
      </div>
      <p
        style="
          text-align: center;
          font-size: 14px;
          text-transform: uppercase;
          font-family: monospace;
        "
      >
        YOU ARE ONE STEP AWAY
      </p>

      <h1
        style="
          text-align: center;
          font-size: 17px;
          text-transform: uppercase;
          font-family: monospace;
        "
      >
        Verify Your Email Address
      </h1>

      <div style="padding: 10px 15px; line-height: 25px">
        <p style="font-family: monospace; text-align: center; font-size: 12px">
          Hi ${username}, You are almost ready to start enjoying
          <b>Connects Chat App</b><br />
          Simply click the big blue button below to verify your email address.
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
  </body>
</html>


        `,
  };

  smtpTransport.sendMail(mailOptions, (err, infor) => {
    if (err) return err;
    return infor;
  });
};

module.exports = sendEmail;
