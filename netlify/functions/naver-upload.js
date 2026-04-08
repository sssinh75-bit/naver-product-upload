const crypto = require("crypto");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const body = JSON.parse(event.body);
  const CLIENT_ID = process.env.NAVER_CLIENT_ID;
  const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

  const timestamp = Date.now().toString();
  const password = `${CLIENT_ID}_${timestamp}`;
  const hashed = crypto.createHmac("sha256", CLIENT_SECRET).update(password).digest("base64");
  const encoded = encodeURIComponent(hashed);

  const tokenUrl = `https://api.commerce.naver.com/external/v1/oauth2/token?grant_type=client_credentials&type=SELF&account_id=${CLIENT_ID}&timestamp=${timestamp}&client_id=${CLIENT_ID}&client_secret_sign=${encoded}&redirect_uri=https://api.commerce.naver.com&client_secret=${CLIENT_SECRET}`;

  const tokenRes = await fetch(tokenUrl, { method: "POST" });
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "토큰 발급 실패", detail: tokenData }),
    };
  }

  const productRes = await fetch(
    "https://api.commerce.naver.com/external/v2/products",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body.product),
    }
  );

  const productData = await productRes.json();
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(productData),
  };
};
