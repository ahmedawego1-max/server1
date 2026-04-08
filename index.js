const express = require('express')
const axios = require('axios')

const app = express()
app.use(express.json())

app.post('/flow', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    const { device, userAgent } = req.body

    // IP INFO
    const ipData = await axios.get(`https://ipapi.co/${ip}/json/`)
    const isp = ipData.data.org || ""

    // --- ФІЛЬТРИ ---

    // Google / hosting
    if (isp.includes("Google")) {
        return res.json({ action: "WHITE" })
    }

    // Desktop
    if (userAgent.includes("Windows") || userAgent.includes("Mac")) {
        return res.json({ action: "WHITE" })
    }

    // Good user
    return res.json({
        action: "OFFER",
        url: "https://your-keitaro-link.com"
    })
})

app.listen(3000, () => {
    console.log("Server started")
})
