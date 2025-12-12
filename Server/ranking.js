const fs = require('fs');
const FILE_PATH = './rankings.json';

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

function getRanking(group, size) {
    const allData = getAllRankings();
    const filtered = allData.filter(r => r.group === +group && r.size === +size);

    filtered.sort((a, b) => {
        if (b.victories !== a.victories) {
            return b.victories - a.victories; 
        }
        return a.games - b.games;
    });

    return filtered.slice(0, 10).map(u => ({
        nick: u.nick,
        victories: u.victories,
        games: u.games
    }));
}

module.exports = { getRanking };