// PLEASE CHANGE THE URL FOR THE MOCK DATA

var URL = 'http://127.0.0.1:5500/MOCK_DATA.csv'
fetch(URL) 
.then((resp) => resp.text()) 
.then(function(data) {
    const tableData = convertData(data)
    displayTable(tableData)


    filterBtn = document.getElementById('filter')
    filterBtn.onclick = function Filter(){
        var cloneTableData = JSON.parse(JSON.stringify(tableData));
        var columnNames = cloneTableData['columnNames']

        for (let i = 0; i < columnNames.length; i++) {
            const columnName = columnNames[i]
            const type = cloneTableData['types'][i];
            const values = cloneTableData[columnName];
            
            if (type == 'NUM') {
                var min = document.getElementById(columnName+'_MIN').value
                var max = document.getElementById(columnName+'_MAX').value
                

                if (min == "") {
                    min = Number.NEGATIVE_INFINITY
                } else {
                    min = +min
                }

                if (max == "") {
                    max = Number.POSITIVE_INFINITY
                } else {
                    max = +max
                }

                for (let j = values.length-1; j >= 0; j--) {
                    const value = values[j];
                    if (value < min || value > max) {
                        
                        // Putting null on deleted rows
                        for (let k = 0; k < columnNames.length; k++) {
                            const colName = columnNames[k];
                            cloneTableData[colName].splice(j,1)
                        }
                        cloneTableData['totalNumberRows'] -= 1
                    }
                    
                    
                }
            } else if (type == "TEX") {

                var search = document.getElementById(columnName+'_TEX').value

                if (search != ""){
                    for (let j = values.length-1; j >= 0; j--) {
                        var value = values[j];
                        if (!value.toUpperCase().includes(search.toUpperCase())) {
                        
                            // Putting null on deleted rows
                            for (let k = 0; k < columnNames.length; k++) {
                                const colName = columnNames[k];
                                cloneTableData[colName].splice(j,1)
                            }
                            cloneTableData['totalNumberRows'] -= 1
                        }
                        
                    }
                }
                
                
            }


        }

        // Display table
        displayTable(cloneTableData)
    }
}).catch(function() {
    alert("Please change the URL of the file in script.js.")
});




    



function convertData(rawText) {
    rows = rawText.trim().split("\n")
    
    // Fist row is header
    var headerNames = rows[0].trim().split(",")
    var columnNames = headerNames.map(getColumnName)
    var types = headerNames.map(getType)



    // Initializing the object for table data
    // keys == columns
    // values == list of values
    var tableData = {}
    for (var i = 0; i < columnNames.length; i++) {
        var columnName = columnNames[i];
        tableData[columnName] = []
    }

    // Start with 1 instead of 0 to skip header
    numRows = 0
    for (var i = 1; i < rows.length; i++) {
        values = rows[i].trim().split(",")
        if (values.length == columnNames.length){
            for (var j = 0; j < columnNames.length; j++) {
                var columnName = columnNames[j];

                var value = values[j]

                // Converting string to number
                if (types[j] == 'NUM') {
                    value = +value
                }


                tableData[columnName].push(value)
            }
            numRows += 1
        } else {
            console.log("Error in line " + i + " in CSV file.")
        }
        

    }

    // Saving for the order
    tableData['columnNames'] = columnNames
    tableData['totalNumberRows'] = numRows
    tableData['types'] = types


    return tableData
}


function getType(column){
    return column.slice(0,3)
}

function getColumnName(column){
    return column.slice(3)
}


function displayTable(tableData) {
    removeElement("table")
    var table = document.createElement("table");
    table.id = "table"


    //Display header
    columnNames = tableData["columnNames"]
    insertDataRow(columnNames, table)

    //Display header
    insertControlsRow(tableData, table)

    console.log(tableData['totalNumberRows'])
    for (var i = 0; i < tableData['totalNumberRows']; i++) {
        var rowValues = []
        for (var j = 0; j < columnNames.length; j++) {
            var columnName = columnNames[j];
            rowValues.push(tableData[columnName][i])
        }
        insertDataRow(rowValues, table)
    }

    var dvCSV = document.getElementById("tableDiv");
    dvCSV.innerHTML = "";
    dvCSV.appendChild(table);
}


function insertDataRow(rowDataList, table){
    var row = table.insertRow();
    for (var j = 0; j < rowDataList.length; j++) {
        var cell = row.insertCell();
        cell.innerHTML = rowDataList[j];
    }
}


function insertControlsRow(tableData, table){
    var row = table.insertRow();

    types = tableData['types']
    columnNames = tableData['columnNames']

    for (var j = 0; j < types.length; j++) {
        var cell = row.insertCell();

        if (types[j] == 'CAT'){
            var uniqueList = tableData[columnNames[j]].filter(onlyUnique)



            createCategoricalControls(cell, columnNames[j], uniqueList)
        
        } else if (types[j] == 'NUM'){
            createNumericalControls(cell, columnNames[j])

        } else if (types[j] == 'TEX'){
            createTextControls(cell, columnNames[j])
        }
    }
}


function createCategoricalControls(cell, columnName, uniqueList){

    for (let i = 0; i < uniqueList.length; i++) {
        const label = uniqueList[i];
        var labelElement = document.createElement("label")
        
        addCheckBox(labelElement, label, columnName+"_"+i)
        cell.appendChild(labelElement)
        // cell.appendChild(document.createElement("br"));
    }
    
}

function addCheckBox(cell, label, id){
    var input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    
    var span = document.createElement("span");
    span.innerHTML = label

    cell.appendChild(input)
    cell.appendChild(span)
}

function createNumericalControls(cell, columnName){
    var input = document.createElement("input");
    input.type = "number";
    input.id = columnName + "_MIN";
    input.placeholder = "Min"
    cell.appendChild(input);

    cell.appendChild(document.createElement("br"));
    cell.appendChild(document.createTextNode(" to "));
    cell.appendChild(document.createElement("br"));

    var input = document.createElement("input");
    input.type = "number";
    input.id = columnName + "_MAX";
    input.placeholder = "Max"
    cell.appendChild(input);
}




function createTextControls(cell, columnName){
    var input = document.createElement("input");
    input.type = "text";
    input.id = columnName + "_TEX";
    cell.appendChild(input);
}

function removeElement(elementId) {
    // Removes an element from the document
    var element = document.getElementById(elementId);
    if (element != null) {
        element.parentNode.removeChild(element);
        console.log("Removing.")
    }   
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}