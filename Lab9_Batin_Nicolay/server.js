const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;
const PRODUCTS_FILE = path.join(ROOT, 'data', 'products.json');
const ORDERS_FILE = path.join(ROOT, 'data', 'orders.json');
const MAX_ORDERS = 10;

const CATEGORIES = ['fork', 'wheels', 'brakes', 'tires', 'saddles'];
const COMBOS = {
    fork_wheels: ['fork', 'wheels'],
    wheels_tires: ['wheels', 'tires']
};
const EDITABLE_FIELDS = [
    'full_name', 'email', 'phone', 'delivery_address',
    'delivery_type', 'delivery_time', 'comment'
];

const AUTH_ERROR = 'Для получения доступа к API необходимо пройти процедуру авторизации. ' +
    'Для этого нужно передать в запросе персональный API Key.';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function readJson(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        return fallback;
    }
}

function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function readBody(req) {
    return new Promise(function (resolve, reject) {
        const chunks = [];
        req.on('data', function (chunk) {
            chunks.push(chunk);
        });
        req.on('end', function () {
            const body = Buffer.concat(chunks).toString('utf8');
            if (body === '') {
                resolve({});
                return;
            }
            try {
                if ((req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) {
                    resolve(Object.fromEntries(new URLSearchParams(body)));
                } else {
                    resolve(JSON.parse(body));
                }
            } catch (error) {
                reject(new Error('Некорректное тело запроса'));
            }
        });
    });
}

function isFilled(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function validateContacts(data) {
    if (!isFilled(data.full_name)) return 'Не указано ФИО';
    if (!isFilled(data.email) || !data.email.includes('@')) return 'Некорректный email';
    if (!isFilled(data.phone)) return 'Не указан номер телефона';
    if (!isFilled(data.delivery_address)) return 'Не указан адрес доставки';
    if (data.delivery_type !== 'now' && data.delivery_type !== 'by_time') {
        return 'Некорректный тип доставки';
    }
    if (data.delivery_type === 'by_time') {
        if (!TIME_RE.test(data.delivery_time || '')) return 'Не указано время доставки';
        if (data.delivery_time < '07:00' || data.delivery_time > '23:00') {
            return 'Доставка возможна только с 7:00 до 23:00';
        }
    }
    return '';
}

function isCombo(key) {
    return Object.prototype.hasOwnProperty.call(COMBOS, key);
}

function validateProducts(data, products) {
    const hasCombo = data.combo !== undefined && data.combo !== null && data.combo !== '';
    if (hasCombo && !isCombo(data.combo)) return 'Неизвестный комплект';

    for (const category of CATEGORIES) {
        const id = data[category + '_id'];
        if (id === undefined || id === null || id === '') continue;

        const product = products.find(function (item) {
            return item.id === Number(id);
        });
        if (!product || product.category !== category) {
            return 'Товар с id ' + id + ' не найден в категории ' + category;
        }
    }

    const isSelected = function (category) {
        const id = data[category + '_id'];
        return id !== undefined && id !== null && id !== '';
    };

    if (!CATEGORIES.some(isSelected)) return 'Заказ не содержит ни одного товара';

    if (hasCombo && !COMBOS[data.combo].every(isSelected)) {
        return 'Состав заказа не соответствует комплекту';
    }

    return '';
}

function toProductId(value) {
    return value === undefined || value === null || value === '' ? null : Number(value);
}

function publicOrder(order) {
    const copy = Object.assign({}, order);
    delete copy.api_key;
    return copy;
}

async function handleApi(req, res, url) {
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[1] === 'products' && parts.length === 2 && req.method === 'GET') {
        sendJson(res, 200, readJson(PRODUCTS_FILE, []));
        return;
    }

    if (parts[1] !== 'orders' || parts.length > 3) {
        sendJson(res, 404, { error: 'Ресурс не найден' });
        return;
    }

    const apiKey = url.searchParams.get('api_key');
    if (!apiKey || !UUID_RE.test(apiKey)) {
        sendJson(res, 401, { error: AUTH_ERROR });
        return;
    }

    const allOrders = readJson(ORDERS_FILE, []);
    const myOrders = allOrders.filter(function (order) {
        return order.api_key === apiKey;
    });

    if (parts.length === 2) {
        if (req.method === 'GET') {
            sendJson(res, 200, myOrders.map(publicOrder));
            return;
        }

        if (req.method === 'POST') {
            if (myOrders.length >= MAX_ORDERS) {
                sendJson(res, 400, { error: 'Нельзя создать больше ' + MAX_ORDERS + ' заказов' });
                return;
            }

            const data = await readBody(req);
            const error = validateContacts(data) || validateProducts(data, readJson(PRODUCTS_FILE, []));
            if (error) {
                sendJson(res, 422, { error: error });
                return;
            }

            const lastId = allOrders.reduce(function (max, order) {
                return Math.max(max, order.id);
            }, 0);

            const order = {
                id: lastId + 1,
                api_key: apiKey,
                created_at: new Date().toISOString(),
                full_name: data.full_name.trim(),
                email: data.email.trim(),
                subscribe: Number(data.subscribe) === 1 ? 1 : 0,
                phone: data.phone.trim(),
                delivery_address: data.delivery_address.trim(),
                delivery_type: data.delivery_type,
                delivery_time: data.delivery_type === 'by_time' ? data.delivery_time : null,
                comment: (data.comment || '').trim(),
                combo: isCombo(data.combo) ? data.combo : null
            };
            CATEGORIES.forEach(function (category) {
                order[category + '_id'] = toProductId(data[category + '_id']);
            });

            allOrders.push(order);
            writeJson(ORDERS_FILE, allOrders);
            console.log('Новый заказ №' + order.id + ' от ' + order.full_name + ':', publicOrder(order));
            sendJson(res, 201, publicOrder(order));
            return;
        }

        sendJson(res, 405, { error: 'Метод не поддерживается' });
        return;
    }

    const order = myOrders.find(function (item) {
        return item.id === Number(parts[2]);
    });
    if (!order) {
        sendJson(res, 404, { error: 'Заказ не найден' });
        return;
    }

    if (req.method === 'GET') {
        sendJson(res, 200, publicOrder(order));
        return;
    }

    if (req.method === 'PUT') {
        const data = await readBody(req);
        const updated = Object.assign({}, order);
        EDITABLE_FIELDS.forEach(function (field) {
            if (data[field] !== undefined) updated[field] = data[field];
        });

        const error = validateContacts(updated);
        if (error) {
            sendJson(res, 422, { error: error });
            return;
        }
        if (updated.delivery_type === 'now') updated.delivery_time = null;

        allOrders[allOrders.indexOf(order)] = updated;
        writeJson(ORDERS_FILE, allOrders);
        sendJson(res, 200, publicOrder(updated));
        return;
    }

    if (req.method === 'DELETE') {
        allOrders.splice(allOrders.indexOf(order), 1);
        writeJson(ORDERS_FILE, allOrders);
        sendJson(res, 200, publicOrder(order));
        return;
    }

    sendJson(res, 405, { error: 'Метод не поддерживается' });
}

function serveStatic(res, url) {
    let filePath = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
    const insideRoot = filePath.startsWith(ROOT + path.sep) || filePath === ROOT;
    const isPrivate = filePath.startsWith(path.join(ROOT, 'data')) || filePath === __filename;

    if (!insideRoot || isPrivate) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, function (error, content) {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Файл не найден');
            return;
        }
        const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type });
        res.end(content);
    });
}

const server = http.createServer(function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, 'http://localhost:' + PORT);

    if (url.pathname.startsWith('/api/')) {
        handleApi(req, res, url).catch(function (error) {
            sendJson(res, 400, { error: error.message });
        });
    } else {
        serveStatic(res, url);
    }
});

server.listen(PORT, function () {
    console.log('Сервер запущен: http://localhost:' + PORT);
});
