const Database_Link = "https://key-system-2136f-default-rtdb.firebaseio.com";
const Database_Key = "xTlsK85HfkZMWbR6CRYIx7olQ6pnVEAp3HYVGcnP";
const ServiceKey = "44pk-uopl-cVIp-kayv-kaBw-QdG1-Dns1-TrAn-ruski-1ov3r";

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


// Get timestamp with days expiration
function getTimestamp(days = 0) {
  const now = Date.now();
  const add = days * 24 * 60 * 60 * 1000;
  return now + add;
}

// Remove All Expired Data from Database function
async function ClearExpiredData() {
  const res = await fetch(`${Database_Link}/Keys.json`);
  const data = await res.json();
  if (!data) return
  const now = Date.now();
  for (const key in data) {
    const keyData = data[key];
    let expires = keyData.expiration;
    if (!expires) continue;
    if (Number(expires) <= now) {
      await fetch(`${Database_Link}/Keys/${key}.json?auth=${Database_Key}`, {
        method: 'DELETE',
        headers: {"Content-Type": "application/json"},
        body: null
      })
    }
  }
}

// Remove Data from Database function
async function RemoveData(key) {
  const res = await fetch(`${Database_Link}/Keys/${key}.json?auth=${Database_Key}`, {
    method: 'DELETE',
    headers: {"Content-Type": "application/json"},
    body: null
  })
}

// Add Data to Database function
async function AddData(key, time, country_code) {
  const res = await fetch(`${Database_Link}/Keys/${key}.json?auth=${Database_Key}`, {
    method: 'PUT',
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      expiration: time,
      country_code: country_code
    })
  })
}

// Allow CORS requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const domain = url.origin; // get service full link
    const path = url.pathname.split("/").filter(Boolean);
    const method = request.method;
    const ip = request.headers.get("CF-Connecting-IP") || "Unknown";
    const countryCode = request.headers.get("CF-IPCountry") || "Unknown";
    const referer = request.headers.get("referer"); // get 1st link to redirected link
    const fingerprint = url.searchParams.get("fp"); // get fp query '?fp=BMW'

    
    // Generate Shrink.Pe Link
    if (path[0] === "shrinkpe" && method === "GET" && fingerprint) {
      const res = await fetch(`https://shrink.pe/api?api=34ae6623373d076be352bf97aec01e5e429fc10e&url=${domain}/generate?fp=${fingerprint}`);
      const json = await res.json();
      return new Response(json.shortenedUrl, { status: 200, headers: {...corsHeaders, "Content-Type": "text/plain" }});
    }

    
    // Generate Key Starter
    if (path[0] === "generate" && method === "GET" && referer && fingerprint) {
      const timestamp = getTimestamp(1);
      const key = crypto.randomUUID().replace(/-/g, "").slice(0, 26);
      ctx.waitUntil(AddData(key, timestamp, countryCode)); // code below it will run imidietly without waiting it finished
      return Response.redirect(`${domain}/show/${key}?fp=${EncodeText(fingerprint, ServiceKey)}`, 302);
    }


    // Show Key (always expires in 24h)
    if (path[0] === "show" && path[1] && method === "GET" && fingerprint) {
      const fp = DecodeText(fingerprint, ServiceKey);
      const key = path[1];
      const html = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Show Key</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #fff;
    }
    .banner-ad {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      text-align: center;
      z-index: 9999;
      background: #000;
      padding: 5px 0;
    }
    .container {
      text-align: center;
      padding: 40px 60px;
      border: 1px solid #fff;
      border-radius: 10px;
      background: #111;
      max-width: 500px;
      width: 90%;
      margin: 130px auto 0 auto; /* Push down below banner */
      box-sizing: border-box;
    }
    .bottom-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      text-align: center;
      z-index: 9999;
      background: #000;
      padding: 5px 0;
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
    @media (max-width: 768px) {
      .container {
        padding: 30px 20px;
        width: 95%;
        margin: 130px auto 280px auto;
      }
    }
  </style>
</head>
<body>

  <!-- POPUNDER AD -->
  <script src="https://socialconventcontext.com/f4/11/9f/f4119f495b011890e222c01927fd7898.js"></script>
  
  <!-- TOP BANNER -->
  <div class="banner-ad">
    <script>
      atOptions = {
        'key' : 'cc37eb734388c1a88867aeca92b43ee9',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
    </script>
    <script src="https://www.highperformanceformat.com/cc37eb734388c1a88867aeca92b43ee9/invoke.js"></script>
  </div>

  <!-- KEY BOX -->
  <div class="container">
    <div class="title">Your Access Key</div>
    <div class="divider"></div>

    <div class="key-text" id="keyText">Loading..</div>

    <button id="copyBtn" onclick="copyKey()">Copy Key</button>
  </div>

  <script type="module">
    import FingerprintJS from 'https://openfpcdn.io/fingerprintjs/v5';  
    const fp = await FingerprintJS.load();  
    const result = await fp.get();
    const keyText = document.getElementById("keyText");
    if (result.visitorId === "${fp}") {
       keyText.innerText = "KEY_${key}";
    } else {
       keyText.innerText = "Bad Request!";
    }
  </script>
  
  <script>
    function copyKey() {
      const keyText = document.getElementById("keyText").innerText;
      const copyBtn = document.getElementById("copyBtn");

      navigator.clipboard.writeText(keyText).then(() => {
        copyBtn.innerText = "Copied!";
        setTimeout(() => {
          copyBtn.innerText = "Copy Key";
        }, 2000);
      }).catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = keyText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copyBtn.innerText = "Copied!";
        setTimeout(() => {
          copyBtn.innerText = "Copy Key";
        }, 2000);
      });
      window.location.href =
        "https://socialconventcontext.com/vcpfaz6mqh?key=1c1cb4fb07424cd21d64a1f69374af54";
    }
  </script>

  <!-- BOTTOM BANNER -->
  <div class="bottom-banner">
  <script>
    atOptions = {
      'key' : 'e57b92dbfcd6136f0f52a6b143c3abbb',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script src="https://www.highperformanceformat.com/e57b92dbfcd6136f0f52a6b143c3abbb/invoke.js"></script>
  </div>

</body>
</html>
`;
      return new Response(html, {
        headers: {...corsHeaders, "Content-Type": "text/html" }
      });
    }
  

    // Check Key
    if (path[0] === "check" && path[1] && method === "GET") {
      let key = path[1];
      key = key.replace("KEY_", "");
      const res = await fetch(`${Database_Link}/Keys/${key}.json`);
      const result = await res.json();
      if (result === null) {
        return new Response("403: Invalid Key", { status: 403, headers: {...corsHeaders, "Content-Type": "text/plain" }});
      }
      const expiration = result.expiration;
      const time = getTimestamp();
      if (Number(expiration) < time) {
        ctx.waitUntil(RemoveData(key)); // code below it will run imidietly without waiting it finished
        ctx.waitUntil(ClearExpiredData()); // code below it will run imidietly without waiting it finished
        return new Response("403: Key Expired", { status: 403, headers: {...corsHeaders, "Content-Type": "text/plain" }});
      }
      if ("country_code" in result && countryCode !== result.country_code) {
        return new Response("400: Bad Request", { status: 400, headers: {...corsHeaders, "Content-Type": "text/plain" }});
      }
      return new Response('200: Success', { status: 200, headers: {...corsHeaders, "Content-Type": "text/plain" }});
    }
    
    // Check Service Status
    if (path[0] === "status" && method === "GET") {
      return new Response("true", { status: 200, headers: {...corsHeaders, "Content-Type": "text/plain" }});
    }

    return new Response("404: Not found", { status: 404, headers: {...corsHeaders, "Content-Type": "text/plain" }});
  }
};
