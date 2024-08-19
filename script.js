document.getElementById('statsForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    let playerName = document.getElementById('playerName').value;
    let teamName = document.getElementById('teamName').value;
    const statType = document.getElementById('statType').value;
    const line = parseFloat(document.getElementById('line').value);
    const errorMessageElement = document.getElementById('error-message');

    // Replace spaces with underscores
    playerName = playerName.replace(/\s+/g, '_');
    teamName = teamName.replace(/\s+/g, '_');

    const apiKey = '744155'; // Your actual API key
    let playerId, teamId;

    try {
        // Fetch team ID
        teamId = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${teamName}`)
            .then(response => response.json())
            .then(data => {
                if (!data.teams) throw new Error('Invalid team name');
                return data.teams[0].idTeam;
            });

        // Fetch player ID
        playerId = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/searchplayers.php?p=${playerName}`)
            .then(response => response.json())
            .then(data => {
                if (!data.player) throw new Error('Invalid player name');
                return data.player[0].idPlayer;
            });

        // Fetch last 10 events for the team
        const events = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${teamId}`)
            .then(response => response.json())
            .then(data => data.results.slice(0, 10));

        let totalPoints = 0;
        let countGames = 0;
        let totalOver = 0;
        
        let results = '';

        for (const event of events) {
            const eventStats = await fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupeventstats.php?id=${event.idEvent}`)
                .then(response => response.json())
                .then(data => {
                    console.log('API response:', data); // Log the API response to inspect it
                    if (!data.playerstats || !Array.isArray(data.playerstats)) {
                        console.error('Unexpected data structure:', data);
                        throw new Error('No stats found for the event or unexpected data structure');
                    }
                    return data.playerstats.find(stat => stat.idPlayer === playerId);
                });
            
            if (eventStats) {
                let statValue = 0;

                // Determine the stat value based on the selected stat type
                if (statType === "Points") {
                    statValue = parseFloat(eventStats.intPoints) || 0;
                } else if (statType === "Assists") {
                    statValue = parseFloat(eventStats.intAssists) || 0;
                } else if (statType === "Rebounds") {
                    statValue = parseFloat(eventStats.intRebounds) || 0;
                }

                if (statValue >= line) {
                    const diff = statValue - line;
                    const diffPercent = ((diff / line) * 100).toFixed(2);
                    const overUnder = statValue > line ? 'Over' : 'Equal';

                    totalPoints += statValue;
                    countGames++;
                    if (statValue > line) totalOver++;

                    results += `
                        <tr>
                            <td>${playerName}</td>
                            <td>${statType}</td>
                            <td>${teamName}</td>
                            <td>${event.strAwayTeam || 'Unknown'}</td>
                            <td>${eventStats.strPosition}</td>
                            <td>${line}</td>
                            <td>${overUnder}</td>
                            <td class="highlight">N/A</td>
                            <td class="highlight">${statValue.toFixed(2)}</td>
                            <td class="highlight">${diff.toFixed(2)}</td>
                            <td class="percentage">${diffPercent}%</td>
                            <td class="percentage">N/A</td>
                            <td class="percentage">N/A</td>
                            <td class="percentage">N/A</td>
                        </tr>
                    `;
                }
            }
        }

        const averagePoints = (totalPoints / countGames).toFixed(2);
        const overPercent = ((totalOver / countGames) * 100).toFixed(2);

        results += `
            <tr>
                <td colspan="8"><strong>Totals / Averages</strong></td>
                <td>${averagePoints}</td>
                <td colspan="2"></td>
                <td>${overPercent}%</td>
                <td colspan="2"></td>
            </tr>
        `;

        document.getElementById('results').innerHTML = results;
        errorMessageElement.innerText = ''; // Clear any previous error message
    } catch (error) {
        console.error(error);
        errorMessageElement.innerText = `Error: ${error.message}`; // Display error message in red
    }
});
