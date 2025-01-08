document.addEventListener("DOMContentLoaded", () => {
    const dataTable = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
    const searchInput = document.getElementById("searchInput");
    const searchAttribute = document.getElementById("searchAttribute");
    let filteredData = []; // Variable to hold filtered data for downloading

    // Učitavanje podataka iz REST API-ja za klubove i igrače
    fetch('/api/clubs-with-players')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch data from API');
            }
            return response.json();
        })
        .then(response => {
            if (response.status === "success") {
                const clubs = response.data;
                populateTable(clubs);
                setupFilter(clubs);
                filteredData = clubs; // Initialize filteredData with all data
            } else {
                console.error('Error in response:', response.message);
            }
        })
        .catch(error => console.error('Error fetching data:', error));

    // Funkcija za popunjavanje tablice
    function populateTable(data) {
        dataTable.innerHTML = ""; // Očisti tablicu

        data.forEach(club => {
            if (club.players && club.players.length > 0) {
                // Za svaki klub dodaj red za svakog igrača
                club.players.forEach(player => {
                    const row = dataTable.insertRow();
                    row.insertCell().textContent = club.ime_kluba;
                    row.insertCell().textContent = club.grad;
                    row.insertCell().textContent = club.osnovan;
                    row.insertCell().textContent = club.stadion;
                    row.insertCell().textContent = club.kapacitet_stadiona;
                    row.insertCell().textContent = club.liga;
                    row.insertCell().textContent = club.trener;

                    // Podaci o igraču
                    row.insertCell().textContent = player.ime_igraca;
                    row.insertCell().textContent = player.pozicija;
                    row.insertCell().textContent = player.broj_dresa;
                    row.insertCell().textContent = player.godine;
                    row.insertCell().textContent = player.nacionalnost;
                    row.insertCell().textContent = player.broj_golova;
                    row.insertCell().textContent = player.broj_asistencija;
                    row.insertCell().textContent = player.godine_u_klubu;
                });
            } else {
                // Ako klub nema igrača, dodaj samo jedan red za klub
                const row = dataTable.insertRow();
                row.insertCell().textContent = club.ime_kluba;
                row.insertCell().textContent = club.grad;
                row.insertCell().textContent = club.osnovan;
                row.insertCell().textContent = club.stadion;
                row.insertCell().textContent = club.kapacitet_stadiona;
                row.insertCell().textContent = club.liga;
                row.insertCell().textContent = club.trener;

                // Dodaj prazne ćelije za podatke igrača
                for (let i = 0; i < 8; i++) {
                    row.insertCell().textContent = "-"; // Prikazuje "-" za prazne podatke
                }
            }
        });
    }

    function setupFilter(data) {
        // Dodajemo event listener za unos teksta u polje za pretragu
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase();
            const attribute = searchAttribute.value;
    
            if (attribute === "wild") {
                // Wild search: pretražuje sve atribute kluba i igrača
                filteredData = data.filter(club => {
                    // Provjera svih atributa kluba
                    const clubMatch = Object.values(club).some(value =>
                        value?.toString().toLowerCase().includes(query)
                    );
    
                    // Provjera svih atributa svakog igrača u klubu
                    const playerMatch = club.players?.some(player =>
                        Object.values(player).some(value =>
                            value?.toString().toLowerCase().includes(query)
                        )
                    );
    
                    return clubMatch || playerMatch; // Ako se podudara s bilo kojim atributom
                });
            } else {
                // Standardna pretraga po odabranom atributu
                filteredData = data.filter(club =>
                    club[attribute]?.toString().toLowerCase().includes(query) ||
                    club.players?.some(player =>
                        player[attribute]?.toString().toLowerCase().includes(query)
                    )
                );
            }
    
            populateTable(filteredData); // Ažuriraj tablicu s filtriranim podacima
        });
    
        // Također ažuriramo pretragu kada se promijeni odabrani atribut
        searchAttribute.addEventListener("change", () => {
            searchInput.dispatchEvent(new Event("input")); // Ponovo pokrećemo pretragu
        });
    }
    

    // Function to convert data to CSV format
    function convertToCSV(data) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Naziv kluba,Grad,Osnovan,Stadion,Kapacitet stadiona,Liga,Trener,Igrači\n";

        data.forEach(club => {
            const row = [
                club.ime_kluba, club.grad, club.osnovan, club.stadion,
                club.kapacitet_stadiona, club.liga, club.trener,
                club.players ? club.players.map(player => `${player.ime_igraca} (${player.pozicija})`).join(", ") : "Nema igrača"
            ];
            csvContent += row.join(",") + "\r\n";
        });

        return encodeURI(csvContent);
    }

    // Function to convert data to JSON format
    function convertToJSON(data) {
        return "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    }

    // Event listener for CSV download
    document.getElementById("downloadCsv").addEventListener("click", function (event) {
        event.preventDefault();
        const csvData = convertToCSV(filteredData);
        const link = document.createElement("a");
        link.setAttribute("href", csvData);
        link.setAttribute("download", "filtered_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Event listener for JSON download
    document.getElementById("downloadJson").addEventListener("click", function (event) {
        event.preventDefault();
        const jsonData = convertToJSON(filteredData);
        const link = document.createElement("a");
        link.setAttribute("href", jsonData);
        link.setAttribute("download", "filtered_data.json");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
