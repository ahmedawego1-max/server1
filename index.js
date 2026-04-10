const express = require('express')
const { GoogleAuth } = require('google-auth-library')

const app = express()
app.use(express.json())

// 🔐 GOOGLE AUTH (ключ який ти залив)
const auth = new GoogleAuth({
    keyFile: './keys/integrity.json', // 📍 СЮДИ ТИ ВЖЕ ПОКЛАВ ФАЙЛ
    scopes: ['https://www.googleapis.com/auth/playintegrity']
})

// 🔥 ТВОЄ PACKAGE NAME (ВАЖЛИВО)
const PACKAGE_NAME = "com.casual.memory.prismtwins"

// =========================
// 🔐 VERIFY INTEGRITY TOKEN
// =========================
async function verifyIntegrityToken(token) {
    try {
        const client = await auth.getClient()

        const response = await client.request({
            url: `https://playintegrity.googleapis.com/v1/${PACKAGE_NAME}:decodeIntegrityToken`,
            method: 'POST',
            data: {
                integrity_token: token
            }
        })

        return response.data
    } catch (e) {
        console.log("❌ Integrity verify error:", e.message)
        return null
    }
}

// =========================
// 🚀 MAIN FLOW
// =========================
app.post('/flow', async (req, res) => {

    const {
        device = "",
        brand = "",
        sdk = 0,
        isEmulator = false,
        integrityToken = ""
    } = req.body

    let integrityData = null

    // 🔐 1. VERIFY TOKEN
    if (integrityToken && integrityToken.length > 20) {
        integrityData = await verifyIntegrityToken(integrityToken)
    }

    // =========================
    // 🧠 RISK SYSTEM
    // =========================
    let risk = 0

    // 🤖 emulator (з клієнта)
    if (isEmulator) {
        risk += 60
        console.log("⚠️ Emulator flag")
    }

    // 📱 device
    const d = device.toLowerCase()

    if (
        d.includes("sdk") ||
        d.includes("emulator") ||
        d.includes("generic") ||
        d.includes("x86")
    ) {
        risk += 60
        console.log("⚠️ Fake device:", device)
    }

    // 🔐 integrity verdict
    if (integrityData) {
        try {
            const verdict =
                integrityData.tokenPayloadExternal?.deviceIntegrity?.deviceRecognitionVerdict || []

            console.log("🔐 Integrity verdict:", verdict)

            if (!verdict.includes("MEETS_DEVICE_INTEGRITY")) {
                risk += 80
                console.log("❌ Device NOT trusted")
            }

        } catch (e) {
            console.log("❌ Parse integrity error")
            risk += 40
        }
    } else {
        // 🔥 якщо нема токена — трохи ризик
        risk += 20
    }

    // =========================
    // 🚫 BLOCK
    // =========================
    if (risk >= 80) {
        console.log("❌ WHITE (blocked)", device, "risk:", risk)
        return res.json({ action: "WHITE" })
    }

    // =========================
    // ✅ OFFER
    // =========================
    console.log("✅ OFFER", device, "risk:", risk)

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
