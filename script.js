document.getElementById('statsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const playerName = document.getElementById('playerName').value;
    const teamName = document.getElementById('teamName').value;
    const line = parseFloat(document.getElementById('line').value);

    const apiKey = '744155'; // Your actual API key
    let playerId, teamId;

    // Fetch team ID
    teamId = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${teamName}`)
        .then(response => response.json())
        .then(data => data.teams[0].idTeam);

    // Fetch player ID
    playerId = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/searchplayers.php?p=${playerName}`)
        .then(response => response.json())
        .then(data => data.player[0].idPlayer);

    // Fetch last 10 events for the team
    const events = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${teamId}`)
        .then(response => response.json())
        .then(data => data.results.slice(0, 10));

    let results = '';

    for (const event of events) {
        const eventStats = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupeventstats.php?id=${event.idEvent}`)
            .then(response => response.json())
            .then(data => data.playerstats.find(stat => stat.idPlayer === playerId));
        
        if (eventStats) {
            const points = parseFloat(eventStats.intPoints) || 0;

            if (points >= line) {
                results += `
                    <tr>
                        <td>${playerName}</td>
                        <td>Points</td>
                        <td>${teamName}</td>
                        <td>${event.strAwayTeam || 'Unknown'}</td>
                        <td>${eventStats.strPosition}</td>
                        <td>${line}</td>
                        <td>${points > line ? 'Over' : 'Equal'}</td>
                        <td class="highlight">N/A</td>
                        <td class="highlight">${points.toFixed(2)}</td>
                        <td class="highlight">${(points - line).toFixed(2)}</td>
                        <td class="percentage">${(((points - line) / line) * 100).toFixed(2)}%</td>
                        <td class="percentage">N/A</td>
                        <td class="percentage">N/A</td>
                        <td class="percentage">N/A</td>
                    </tr>
                `;
            }
        }
    }

    document.getElementById('results').innerHTML = results;
});
