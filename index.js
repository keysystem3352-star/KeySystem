const ServiceKey = "44pk-uopl-cVIp-kayv-pQjd-QdG1-Dns1-adO0-russa-1ov3r";
const HashCode_Database = "https://hash-code-20ecd-default-rtdb.firebaseio.com/";
const HashCode_SavedData = "https://raw.githubusercontent.com/MainScripts352/Database/refs/heads/main/Hash%20Code%20Database";
const SYSTEM_KEY = "jamx-wpf4-20gn-920g-Il0v3-Russia-382g";

//-- Encode Decode Word Function
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
function toBase32(bytes) {
  let bits = 0, value = 0, output = '';
  for (let byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(str) {
  let bits = 0, value = 0, output = [];
  for (let c of str.toUpperCase()) {
    const index = base32Alphabet.indexOf(c);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

function EncodeText(text, key) {
  const data = new TextEncoder().encode(text);
  const keyData = new TextEncoder().encode(key);
  const encrypted = data.map((b, i) => b ^ keyData[i % keyData.length]);
  return toBase32(encrypted);
}

function DecodeText(encoded, key) {
  const data = fromBase32(encoded);
  const keyData = new TextEncoder().encode(key);
  const decrypted = data.map((b, i) => b ^ keyData[i % keyData.length]);
  return new TextDecoder().decode(new Uint8Array(decrypted));
}
//--


function _getKeyBytes(key) {
  return new TextEncoder().encode(key);
}

function _bytesToString(bytes) {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(bytes).toString("utf-8");
}

function encodeWithSystemKey(message) {
  if (typeof message !== "string") throw new TypeError("message must be a string");
  const keyBytes = _getKeyBytes(SYSTEM_KEY);
  const msgBytes = new TextEncoder().encode(message);
  const keyLen = keyBytes.length;
  let hex = "";
  for (let i = 0; i < msgBytes.length; i++) {
    const xored = msgBytes[i] ^ keyBytes[i % keyLen];
    hex += xored.toString(16).padStart(2, "0");
  }
  return hex;
}

function decodeWithSystemKey(hexstr) {
  if (typeof hexstr !== "string") throw new TypeError("hexstr must be a string");
  if (hexstr.length % 2 !== 0) throw new Error("Invalid hex string length");
  const keyBytes = _getKeyBytes(SYSTEM_KEY);
  const keyLen = keyBytes.length;
  const byteLen = hexstr.length / 2;
  let outBytes = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    const pair = hexstr.substr(i * 2, 2);
    const num = parseInt(pair, 16);
    if (Number.isNaN(num)) throw new Error("Invalid hex characters in input");
    const k = keyBytes[i % keyLen];
    outBytes[i] = num ^ k;
  }
  return _bytesToString(outBytes);
}

// Get timestamp with days expiration
async function getTimestamp(days = 0) {
  const response = await fetch("http://worldclockapi.com/api/json/utc/now");
  const data = await response.json();
  const time = data.currentFileTime;
  const timeMs = Math.floor(time / 10000);
  const addedMs = days * 24 * 60 * 60 * 1000;
  return timeMs + addedMs;
}


export default {
  async fetch(request) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const path = url.pathname.split("/").filter(Boolean);
    const method = request.method;
    const ip = request.headers.get("CF-Connecting-IP") || "Unknown";

    // Make Key Starter
    if (path[0] === "make" && method === "GET") {
      const timestamp = await getTimestamp(1);
      return Response.redirect(`${domain}/create/${btoa(timestamp)}`, 302);
    }
    
    // Create Key (always expires in 24h)
    if (path[0] === "create" && path[1] && method === "GET") {
      const encodedkey = atob(path[1]);
      const key = encodeWithSystemKey(String(encodedkey));

      const html = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Show Key</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 5;
      background: #000;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #fff;
    }

    .container {
      text-align: center;
      padding: 40px 60px;
      border: 1px solid #fff;
      border-radius: 10px;
      background: #111;
      max-width: 500px;
      width: 90%;
    }

    .title {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 15px;
      letter-spacing: 1px;
      color: #aaa;
    }

    .divider {
      width: 60px;
      height: 2px;
      background: #fff;
      margin: 15px auto 25px;
    }

    .key-text {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 25px;
      word-break: break-all;
    }

    button {
      padding: 12px 30px;
      font-size: 16px;
      font-weight: 600;
      background: #fff;
      color: #000;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    button:hover {
      background: #ddd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">Your Access Key</div>
    <div class="divider"></div>
    <div class="key-text" id="keyText">KEY_${key}</div>
    <button id="copyBtn" onclick="copyKey()">Copy Key</button>
  </div>

  <script>
    function copyKey() {
      const keyText = document.getElementById("keyText").innerText;
      const copyBtn = document.getElementById("copyBtn");

      // Try modern clipboard API
      navigator.clipboard.writeText(keyText).then(() => {
        copyBtn.innerText = "Copied!";
        setTimeout(() => copyBtn.innerText = "Copy Key", 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = keyText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        copyBtn.innerText = "Copied!";
        setTimeout(() => copyBtn.innerText = "Copy Key", 2000);
      });
    }
  </script>
</body>
</html>`;
      
      return new Response(html, {
        headers: { "Content-Type": "text/html" }
      });
    }

    // Check Key
    if (path[0] === "check" && path[1] && method === "GET") {
      let key = path[1];
      key = key.replace("KEY_", "");
      return new Response(decodeWithSystemKey(key), {
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    // Check Service Status
    if (path[0] === "status" && method === "GET") {
      return new Response(true, {
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    return new Response("404: Not found", { status: 404 });
  }
};
