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
    const body = JSON.parse(event.body);
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    // 타임스탬프 (3초 전)
    const timestamp = String(Date.now() - 3000);

    // bcrypt 서명 생성
    const password = CLIENT_ID + "_" + timestamp;
    const hashed = bcrypt.hashSync(password, CLIENT_SECRET);
    const client_secret_sign = Buffer.from(hashed).toString("base64");

    // 토큰 발급 (body로 전송)
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      timestamp: timestamp,
      client_secret_sign: client_secret_sign,
      grant_type: "client_credentials",
      type: "SELF"
    });

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

    // 상품 등록
    const productRes = await fetch(
      "https://api.commerce.naver.com/external/v2/products",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body.product)
      }
    );

    const productData = await productRes.json();
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(productData)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message })
    };
  }
};
