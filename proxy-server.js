
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

const API_TARGET_URL = 'https://back-end-encuestas-a5fxb8g7gwavevgh.canadacentral-01.azurewebsites.net/api';

app.use(express.json());
app.use(cors());

app.use('/api', async (req, res) => {
    try {
        const url = `${API_TARGET_URL}${req.url}`;
        const method = req.method.toLowerCase();

        const config = {
            method,
            url,
            headers: { ...req.headers, host: new URL(API_TARGET_URL).host },
            data: req.body
        };

        // Eliminar el header 'host' que es sobreescrito por axios
        delete config.headers.host;

        const response = await axios(config);

        res.status(response.status).send(response.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const data = error.response ? error.response.data : 'Error en el servidor proxy';
        res.status(status).send(data);
    }
});

app.listen(port, () => {
    console.log(`Servidor proxy escuchando en http://localhost:${port}`);
});
