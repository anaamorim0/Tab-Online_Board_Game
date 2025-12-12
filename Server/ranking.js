// ranking.js
const fs = require('fs');

const FILE_PATH = './rankings.json';

// Ler dados do ficheiro
function getAllRankings() {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            return [];
        }
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro a ler rankings.json:", err);
        return [];
    }
}

// Obter a tabela ordenada para um grupo e tamanho específicos
function getRanking(group, size) {
    const allData = getAllRankings();

    // 1. Filtrar: Queremos apenas jogos deste Grupo e deste Tamanho
    // (O '+' garante que comparamos números com números)
    const filtered = allData.filter(r => r.group === +group && r.size === +size);

    // 2. Ordenar: Mais vitórias primeiro. 
    // Se tiverem as mesmas vitórias, quem tem menos jogos fica à frente (opcional)
    filtered.sort((a, b) => {
        if (b.victories !== a.victories) {
            return b.victories - a.victories; // Decrescente
        }
        return a.games - b.games; // Desempate por menos jogos
    });

    // 3. Cortar: Retornar apenas os top 10
    return filtered.slice(0, 10).map(u => ({
        nick: u.nick,
        victories: u.victories,
        games: u.games
    }));
}

module.exports = { getRanking };