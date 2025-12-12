const fs = require('fs');
const crypto = require('crypto');

const FILE_PATH = './users.json';

function hashPassword(password) {
    const hash = crypto.createHash('md5');
    hash.update(password);
    return hash.digest('hex');
}

function getUsers() {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            return [];
        }
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler users.json:", err);
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
}

function register(nick, password) {
    const users = getUsers();
    const existingUser = users.find(u => u.nick === nick);
    const hashedPass = hashPassword(password);

    if (existingUser) {
        if (existingUser.pass === hashedPass) {
            return { status: 200, message: "Login efetuado com sucesso." };
        } else {
            return { status: 401, error: "User registered with a different password" };
        }
    } else {
        const newUser = { nick: nick, pass: hashedPass };
        users.push(newUser);
        saveUsers(users);
        return { status: 200, message: "Utilizador registado com sucesso." };
    }
}

function validateUser(nick, password) {
    const users = getUsers();
    const user = users.find(u => u.nick === nick);
    if (!user) return false; 
    
    const hashed = hashPassword(password);
    return user.pass === hashed;
}

module.exports = { register, validateUser };