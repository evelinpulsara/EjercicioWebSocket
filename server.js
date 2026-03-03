// server.js - WebSocket + HTTPS para macOS
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 🔐 Cargar certificados SSL
const options = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// 🌐 Crear servidor HTTPS
const server = https.createServer(options, (req, res) => {
    console.log(`📥 Request: ${req.url}`);
    
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error('❌ Error leyendo index.html:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error interno del servidor');
            } else {
                res.writeHead(200, { 
                    'Content-Type': 'text/html; charset=utf-8',
                    'Strict-Transport-Security': 'max-age=31536000'
                });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - No encontrado');
    }
});

// 🔌 WebSocket sobre HTTPS
const wss = new WebSocket.Server({ server });

console.log("🚀 Servidor iniciado: wss://localhost:8080");

// Generar datos de sensores
const generarDatos = () => {
    const nombres = ["Sensor_Alfa", "Sensor_Beta", "Sensor_Gamma", "Sensor_Delta"];
    return JSON.stringify({
        id: Math.floor(Math.random() * 1000),
        nombre: nombres[Math.floor(Math.random() * nombres.length)],
        temperatura: (Math.random() * (40 - 20) + 20).toFixed(2) + "°C",
        timestamp: new Date().toISOString()
    });
};

wss.on('connection', (ws, req) => {
    const clientInfo = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
    console.log(`✅ Cliente conectado: ${clientInfo}`);

    // Enviar datos cada 2 segundos
    const intervalo = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const datos = generarDatos();
            ws.send(datos);
            console.log(`📤 Enviando: ${datos}`);
        }
    }, 2000);

    ws.on('close', () => {
        console.log(`❌ Cliente desconectado: ${clientInfo}`);
        clearInterval(intervalo);
    });

    ws.on('error', (err) => {
        console.error(`❌ Error WebSocket: ${err.message}`);
        clearInterval(intervalo);
    });
});

server.on('error', (err) => {
    console.error('❌ Error del servidor:', err.message);
});

server.listen(8080, 'localhost', () => {
    console.log('🔒 Servidor HTTPS escuchando en https://localhost:8080');
    console.log('📡 WebSocket seguro en wss://localhost:8080');
    console.log('📁 Certificados: key.pem, cert.pem');
});