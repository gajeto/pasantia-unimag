async function drawTable() {
    // load data
    const pathToJSON = 'https://raw.githubusercontent.com/gajeto/XGBoost-Visualization/main/data/results.json'
    let dataset = await d3.json(pathToJSON)
  
    const table = d3.select("#table")

    const numberOfRows = 10
    const colorScale = d3.interpolateHcl("#a5c3e8", "#efa8a1")
    const grayColorScale = d3.interpolateHcl("#fff", "#bdc4ca")
    const tempScale = d3.scaleLinear()
        .domain(d3.extent(dataset.slice(0, numberOfRows), d => d.Predicted))
        .range([0, 1])
    const humidityScale = d3.scaleLinear()
        .domain(d3.extent(dataset.slice(0, numberOfRows), d => d.Error))
        .range([0, 1])

    const columns = [
        // Format our dates to make them more human readable
        { label: "Targeted", type: "number", format: d => d3.format(".1f")(d.Test) },
        { label: "Predicted", type: "number", format: d => d3.format(".1f")(d.Predicted), background: d => colorScale(tempScale(d.Predicted)) },
        { label: "Error", type: "number", format: d => d3.format(".2f")(d.Error), background: d => grayColorScale(humidityScale(d.Error)) }, // Use colors white to slate gray to indicate windspeed
        { label: "Obesity Level(Rounded prediction)", type: "text", format: d => d.NObesity },
    ]

    table.append("thead").append("tr")
        .selectAll("thead")
        .data(columns)
        .enter().append("th")
        .text(d => d.label)
        .attr("class", d => d.type)

    const body = table.append("tbody")
    
    dataset.forEach(d => {
        body.append("tr")
            .selectAll("td")
            .data(columns)
            .enter().append("td")
            .text(column => column.format(d))
            .attr("class", column => column.type)
            .style("background", column => column.background && column.background(d))
            .style("transform", column => column.transform && column.transform(d))
    })
}
drawTable()