document.addEventListener("DOMContentLoaded", () => {
    const dataTable = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
    const searchInput = document.getElementById("searchInput");
    const searchAttribute = document.getElementById("searchAttribute");
    let filteredData = [];  // Variable to hold filtered data for downloading

    // Učitavanje podataka iz JSON-a
    fetch('/data/klub.json')
        .then(response => response.json())
        .then(data => {
            populateTable(data);
            setupFilter(data);
            filteredData = data;  // Initialize filteredData with all data
        });

    // Funkcija za popunjavanje tablice
    function populateTable(data) {
        dataTable.innerHTML = "";
        data.forEach(item => {
            const row = dataTable.insertRow();
            row.insertCell().textContent = item.ime_kluba;
            row.insertCell().textContent = item.grad;
            row.insertCell().textContent = item.osnovan;
            row.insertCell().textContent = item.stadion;
            row.insertCell().textContent = item.kapacitet_stadiona;
            row.insertCell().textContent = item.liga;
            row.insertCell().textContent = item.trener;
            row.insertCell().textContent = item.ime_igraca;
            row.insertCell().textContent = item.pozicija;
            row.insertCell().textContent = item.broj_dresa;
            row.insertCell().textContent = item.godine;
            row.insertCell().textContent = item.nacionalnost;
            row.insertCell().textContent = item.broj_golova;
            row.insertCell().textContent = item.broj_asistencija;
            row.insertCell().textContent = item.godine_u_klubu;
        });
    }

    // Funkcija za filtriranje podataka
    function setupFilter(data) {
        document.getElementById("filterForm").addEventListener("submit", event => {
            event.preventDefault();
            const query = searchInput.value.toLowerCase();
            const attribute = searchAttribute.value;

            filteredData = data.filter(item => 
                item[attribute].toString().toLowerCase().includes(query)
            );
            populateTable(filteredData);
        });
    }

    // Function to convert data to CSV format
    function convertToCSV(data) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Naziv kluba,Grad,Osnovan,Stadion,Kapacitet stadiona,Liga,Trener,Ime igrača,Pozicija,Broj dresa,Godine,Nacionalnost,Broj golova,Broj asistencija,Godine u klubu\n";

        data.forEach(item => {
            const row = [
                item.ime_kluba, item.grad, item.osnovan, item.stadion,
                item.kapacitet_stadiona, item.liga, item.trener, item.ime_igraca,
                item.pozicija, item.broj_dresa, item.godine, item.nacionalnost,
                item.broj_golova, item.broj_asistencija, item.godine_u_klubu
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
