const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Campaign Status Track karne ke liye
let campaignStatus = {
    isRunning: false,
    total: 0,
    sent: 0,
    failed: 0,
    currentEmail: '',
    currentSender: '',
    logs: []
};

// Delay Function (3-4 second rukne ke liye)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Browser mein index.html kholne ke liye
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Live Progress check karne ka rasta
app.get('/status', (req, res) => {
    res.json(campaignStatus);
});

// Campaign Stop karne ka rasta
app.post('/stop', (req, res) => {
    campaignStatus.isRunning = false;
    campaignStatus.logs.unshift('🛑 Campaign manually stopped by user.');
    res.json({ message: 'Stopped' });
});

// Asli Email Sending Engine (Multi-Account Rotation ke sath)
app.post('/send-campaign', upload.single('attachment'), async (req, res) => {
    if (campaignStatus.isRunning) {
        return res.status(400).json({ error: 'Ek campaign pehle se chal raha hai!' });
    }

    const { senders, recipients, subject, message, delaySeconds } = req.body;
    const senderList = JSON.parse(senders);
    const recipientList = JSON.parse(recipients);
    const file = req.file;
    const gap = (parseInt(delaySeconds) || 4) * 1000;

    if (!senderList.length || !recipientList.length) {
        return res.status(400).json({ error: 'Sender Gmail ya Recipient Emails missing hain!' });
    }

    // Reset Status
    campaignStatus = {
        isRunning: true,
        total: recipientList.length,
        sent: 0,
        failed: 0,
        currentEmail: 'Starting...',
        currentSender: '',
        logs: [`🚀 Campaign Started! Total Emails: ${recipientList.length} | Active Senders: ${senderList.length}`]
    };

    res.json({ message: 'Campaign Started Successfully!' });

    // Background Loop (Round-Robin Rotation)
    for (let i = 0; i < recipientList.length; i++) {
        if (!campaignStatus.isRunning) break;

        const targetEmail = recipientList[i];
        // Smart Rotation: 1st mail -> Gmail 1, 2nd mail -> Gmail 2...
        const senderIndex = i % senderList.length;
        const currentSender = senderList[senderIndex];

        campaignStatus.currentEmail = targetEmail;
        campaignStatus.currentSender = currentSender.email;

        try {
            // Har sender ka transporter banana
            let transporterConfig;
            if (currentSender.host && currentSender.host.trim() !== '') {
                // Custom Domain Email ke liye
                transporterConfig = {
                    host: currentSender.host.trim(),
                    port: parseInt(currentSender.port) || 465,
                    secure: true,
                    auth: {
                        user: currentSender.email.trim(),
                        pass: currentSender.password.trim()
                    }
                };
            } else {
                // Normal Gmail ke liye
                transporterConfig = {
                    service: 'gmail',
                    auth: {
                        user: currentSender.email.trim(),
                        pass: currentSender.password.trim()
                    }
                };
            }

            const transporter = nodemailer.createTransport(transporterConfig);

            const mailOptions = {
                from: `"${currentSender.name || 'Special Offer'}" <${currentSender.email.trim()}>`,
                to: targetEmail,
                subject: subject,
                html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; white-space: pre-wrap;">${message}</div>`,
                attachments: file ? [{
                    filename: file.originalname,
                    path: file.path
                }] : []
            };

            await transporter.sendMail(mailOptions);
            campaignStatus.sent++;
            campaignStatus.logs.unshift(`✅ [${i + 1}/${recipientList.length}] Sent to ${targetEmail} (via ${currentSender.email})`);
        } catch (err) {
            campaignStatus.failed++;
            campaignStatus.logs.unshift(`❌ [${i + 1}/${recipientList.length}] Failed for ${targetEmail} (${ currentSender.email }): ${err.message}`);
        }

        // Sirf lastke 50 logs rakho taaki memory full na ho
        if (campaignStatus.logs.length > 50) campaignStatus.logs.pop();

        // Agle mail se pehle 3-4 second ka gap
        if (i < recipientList.length - 1 && campaignStatus.isRunning) {
            await sleep(gap);
        }
    }

    // Uploaded file safai
    if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
    }

    campaignStatus.isRunning = false;
    campaignStatus.currentEmail = 'Completed!';
    campaignStatus.logs.unshift(`🎉 Campaign Finished! Sent: ${campaignStatus.sent}, Failed: ${campaignStatus.failed}`);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 TERA PORTAL READY HAI!`);
    console.log(`👉 Browser mein ye khol: http://localhost:${PORT}`);
    console.log(`=========================================`);
});