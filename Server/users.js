// users.js
const fs = require('fs');
const crypto = require('crypto');

const FILE_PATH = './users.json';

// Função auxiliar para encriptar a password (MD5)
function hashPassword(password) {
    const hash = crypto.createHash('md5');
    hash.update(password);
    return hash.digest('hex');
}

// Ler utilizadores do ficheiro
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

// Guardar utilizadores no ficheiro
function saveUsers(users) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(users, null, 2));
}

// Função Principal: Registar (ou verificar login)
function register(nick, password) {
    const users = getUsers();
    const existingUser = users.find(u => u.nick === nick);
    const hashedPass = hashPassword(password);

    if (existingUser) {
        // Se o utilizador já existe, verificamos se a password bate certo
        if (existingUser.pass === hashedPass) {
            return { status: 200, message: "Login efetuado com sucesso." }; // Login OK
        } else {
            return { status: 401, error: "User registered with a different password" }; // Password errada
        }
    } else {
        // Se não existe, criamos novo
        const newUser = { nick: nick, pass: hashedPass };
        users.push(newUser);
        saveUsers(users);
        return { status: 200, message: "Utilizador registado com sucesso." };
    }
}
// [users.js] - Adicionar esta função antes do module.exports

function validateUser(nick, password) {
    const users = getUsers();
    const user = users.find(u => u.nick === nick);
    if (!user) return false; // Utilizador não existe
    
    const hashed = hashPassword(password);
    return user.pass === hashed; // Retorna true se a password bater certo
}

// Atualizar o export
module.exports = { register, validateUser };
