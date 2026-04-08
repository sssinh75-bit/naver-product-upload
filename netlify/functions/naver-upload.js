const crypto = require("crypto");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

    console.log("CLIENT_ID:", CLIENT_ID);
    console.log("CLIENT_SECRET length:", CLIENT_SECRET ? CLIENT_SECRET.length : 0);

    const timestamp = Date.now().toString();
    const password = CLIENT_ID + "_" + timestamp;
    const hashed = crypto.createHmac("sha256", CLIENT_SECRET).update(password).digest("base64");
    const encoded = encodeURIComponent(hashed);

    const tokenUrl = "https://api.commerce.naver.com/external/v1/oauth2/token?grant_type=client_credentials&type=SELF&account_id=" + CLIENT_ID + "&timestamp=" + timestamp + "&client_secret_sign=" + encoded;

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    const tokenData = await tokenRes.json();

    console.log("tokenData:", JSON.stringify(tokenData));

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "토큰 발급 실패", detail: tokenData })
      };
    }

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
      body: JSON.stringify({ error: err.message })
    };
  }
};
