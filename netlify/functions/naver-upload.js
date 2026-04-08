const bcrypt = require("bcryptjs");

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    // 디버그: 환경변수 확인
    console.log("CLIENT_ID:", CLIENT_ID);
    console.log("CLIENT_ID length:", CLIENT_ID ? CLIENT_ID.length : 0);
    console.log("CLIENT_SECRET:", CLIENT_SECRET);
    console.log("CLIENT_SECRET length:", CLIENT_SECRET ? CLIENT_SECRET.length : 0);

    const timestamp = String(Date.now() - 3000);
    const password = CLIENT_ID + "_" + timestamp;
    const hashed = bcrypt.hashSync(password, CLIENT_SECRET);
    const client_secret_sign = Buffer.from(hashed).toString("base64");

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      timestamp: timestamp,
      client_secret_sign: client_secret_sign,
      grant_type: "client_credentials",
      type: "SELF"
    });

    console.log("params:", params.toString());

    const tokenRes = await fetch(
      "https://api.commerce.naver.com/external/v1/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      }
    );

    const tokenData = await tokenRes.json();
    console.log("tokenData:", JSON.stringify(tokenData));

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "토큰 발급 실패", detail: tokenData })
      };
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: true, token: accessToken.substring(0, 20) + "..." })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
