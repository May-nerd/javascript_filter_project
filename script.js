// PLEASE CHANGE THE URL FOR THE MOCK DATA

var URL = 'http://127.0.0.1:5500/MOCK_DATA.csv'

var FilterFunc = null
var ResetFunc = null


fetch(URL) 
.then((resp) => resp.text()) 
.then(function(data) {
    FilterFunc = Filter
    ResetFunc = Reset
    var oldData = JSON.parse(localStorage.getItem('rawText'))
    var savedFilters = JSON.parse(localStorage.getItem('filters'))

    var tableData = null
    if ( data == oldData) {
        tableData = JSON.parse(localStorage.getItem('tableData'))
        displayTable(tableData)
        Filter();
    } else {
        Reset()
    }

    function Reset() {
        tableData = convertData(data)
        displayTable(tableData)
        saveRawText(data)
        saveTableData(tableData)
    }

    function Filter() {
        // Create table data clone
        var cloneTableData = JSON.parse(JSON.stringify(tableData));
        console.log(cloneTableData)
        var columnNames = cloneTableData['columnNames']

        // Filter for each column
        for (let i = 0; i < columnNames.length; i++) {
            const columnName = columnNames[i]
            const type = cloneTableData['types'][i];
            const values = cloneTableData[columnName];
            
            // For Numerical
            if (type == 'NUM') {
                var min = document.getElementById(columnName+'_MIN').value
                var max = document.getElementById(columnName+'_MAX').value
                
                cloneTableData["filters"][i]["min"] = min
                cloneTableData["filters"][i]["max"] = max

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

                if (min > max) {
                    alert("Minimum is greater than maximum!")
                }

                for (let j = values.length-1; j >= 0; j--) {
                    const value = values[j];

                    // Deleting rows
                    if (value < min || value > max) {
                        for (let k = 0; k < columnNames.length; k++) {
                            const colName = columnNames[k];
                            cloneTableData[colName].splice(j,1)
                        }
                        cloneTableData['totalNumberRows'] -= 1
                    }
                }

            } 
            // For text columns
            else if (type == "TEX") {
                var search = document.getElementById(columnName+'_TEX').value
                
                
                cloneTableData["filters"][i]["keyword"] = search
                for (let j = values.length-1; j >= 0; j--) {
                    var value = values[j];

                    // Deleting rows
                    if (!value.toUpperCase().includes(search.toUpperCase())) {
                        for (let k = 0; k < columnNames.length; k++) {
                            const colName = columnNames[k];
                            cloneTableData[colName].splice(j,1)
                        }
                        cloneTableData['totalNumberRows'] -= 1
                    }
                }
                
            } 
            // For categorical columns
            else if (type == "CAT") {
                var checkBoxes = document.getElementsByClassName(columnName+"_CAT")
                var checked = cloneTableData["filters"][i]["checked"] 

                var isAllUnchecked = true
                var checkedCategories = []
                for (let j = 0; j < checked.length; j++) {
                    checked[j] = checkBoxes[j].checked
                    
                    if (checked[j]) {
                        isAllUnchecked = false
                        checkedCategories.push(checkBoxes[j].value)
                    }
                }

                if (isAllUnchecked) {
                    checkedCategories = cloneTableData["filters"][i]['categories']
                }

                for (let j = values.length-1; j >= 0; j--) {
                    var value = values[j];

                    // Deleting rows
                    if (!checkedCategories.includes(value)) {
                        for (let k = 0; k < columnNames.length; k++) {
                            const colName = columnNames[k];
                            cloneTableData[colName].splice(j,1)
                        }
                        cloneTableData['totalNumberRows'] -= 1
                    }
                }
            }
        }
        // Saving the filters
        tableData['filters'] =  cloneTableData['filters']
        // Display table
        displayTable(cloneTableData)
        saveTableData(tableData)
    }

})
// .catch(function(e) {
//     alert("Please change the URL of the file in script.js.")
// });


function convertData(rawText) {
    rows = rawText.trim().split("\n")
    
    // Fist row is header
    var columnNames = rows[0].trim().split(",")


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
                tableData[columnName].push(value)
            }
            numRows += 1
        } else {
            console.log("Error in line " + i + " in CSV file.")
        }
    }

    var types = []
    for (let i = 0; i < columnNames.length; i++) {
        const columnName = columnNames[i];
        var values = tableData[columnName]
        
        if (!isNaN(+values[0])) {
            tableData[columnName].map(stringToNum)
            types.push("NUM")
        } else if (tableData[columnName].filter(onlyUnique).length <= 5) {
            types.push("CAT")
        } else {
            types.push("TEX")
        }

    }





    // Saving for the order
    tableData['columnNames'] = columnNames
    tableData['totalNumberRows'] = numRows
    tableData['types'] = types
    
    // Adding filters
    tableData["filters"] = []
    for (let i = 0; i < columnNames.length; i++) {
        const columnName = columnNames[i];
        const type = types[i];

        var filterObject = {}
        if (type == "CAT"){
            var categories = tableData[columnNames[i]].filter(onlyUnique)
            filterObject["categories"] = categories

            var checked = []
            for (let j = 0; j < categories.length; j++) {
                checked.push(false)
            }

            filterObject["checked"] = checked
        } else if (type == "NUM") {
            filterObject["min"] = ''
            filterObject["max"] = ''
        } else if (type == "TEX") {
            filterObject["keyword"] = ''
        }
        tableData["filters"].push(filterObject)
    }


    

    return tableData
}


function stringToNum(value){
    return +value
}



function saveTableData(tableData){
    localStorage.setItem('tableData', JSON.stringify(tableData))
}

function saveFilterActions(filterObject){
    var filters =  JSON.parse(localStorage.getItem('filters'))

    if (filters == null) {
        filters = []
    }

    filters.push(filterObject)

    localStorage.setItem('filters', JSON.stringify(filters))
}

function saveRawText(rawText){
    localStorage.setItem('rawText', JSON.stringify(rawText))
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

    var types = tableData['types']
    var columnNames = tableData['columnNames']
    var filters = tableData['filters']

    for (var j = 0; j < types.length; j++) {
        var cell = row.insertCell();
        if (types[j] == 'CAT'){
            var filterObject = tableData['filters'][j]
            var values = tableData[columnNames[j]]
            createCategoricalControls(cell, columnNames[j], filterObject, values)
        } else if (types[j] == 'NUM'){
            createNumericalControls(cell, columnNames[j], filters[j])
        } else if (types[j] == 'TEX'){
            createTextControls(cell, columnNames[j], filters[j])
        }
    }
}


function createCategoricalControls(cell, columnName, filterObject, values){
    var uniqueList = filterObject['categories']
    var checked = filterObject['checked']
    for (let i = 0; i < uniqueList.length; i++) {
        const label = uniqueList[i];

        var count = countValues(label, values)

        
        var labelElement = document.createElement("label")
        addCheckBox(labelElement, label, columnName+"_CAT", checked[i], count)
        cell.appendChild(labelElement)
    }   
}

function countValues(keyword, values){
    var count = 0
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if(value == keyword) {
            count++
        }
    }
    return count
}


function addCheckBox(cell, label, id, isChecked, count){
    var input = document.createElement("input");
    input.type = "checkbox";
    input.classList = [id];
    input.value = label
    input.checked = isChecked

    var span = document.createElement("span");
    span.innerHTML = label+" ("+count+")"

    cell.appendChild(input)
    cell.appendChild(span)
}

function createNumericalControls(cell, columnName, filterObject){
    var input = document.createElement("input");
    input.type = "number";
    input.id = columnName + "_MIN";
    input.placeholder = "Min"
    input.value = filterObject['min']
    cell.appendChild(input);

    cell.appendChild(document.createElement("br"));
    cell.appendChild(document.createTextNode(" to "));
    cell.appendChild(document.createElement("br"));

    var input = document.createElement("input");
    input.type = "number";
    input.id = columnName + "_MAX";
    input.placeholder = "Max"
    input.value = filterObject['max']
    cell.appendChild(input);
}

function createTextControls(cell, columnName, filterObject){
    var input = document.createElement("input");
    input.type = "text";
    input.id = columnName + "_TEX";
    input.placeholder = "Keyword"
    input.value = filterObject['keyword']
    
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