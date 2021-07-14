async function drawLineChart() {

    // 1. Access data
    const pathToJSON = 'https://raw.githubusercontent.com/gajeto/XGBoost-Visualization/main/data/results.json'
    let dataset = await d3.json(pathToJSON)

    const yAccessor = d => d.Predicted
    const y2Accessor = d => d.Test
    const xAccessor = d => d.Data
    dataset = dataset.sort((a, b) => xAccessor(a) - xAccessor(b)).slice(0, 200)

    // 2. Create chart dimensions

    let dimensions = {
        width: window.innerWidth * 0.9,
        height: 400,
        margin: {
            top: 15,
            right: 15,
            bottom: 40,
            left: 60,
        },
    }
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    // 3. Draw canvas

    const wrapper = d3.select("#wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    const bounds = wrapper.append("g")
        .style("transform", `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

    bounds.append("defs").append("clipPath")
        .attr("id", "bounds-clip-path")
        .append("rect")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)

    const clip = bounds.append("g")
        .attr("clip-path", "url(#bounds-clip-path)")

    // 4. Create scales

    const yScale = d3.scaleLinear()
        .domain(d3.extent(dataset, yAccessor))
        .range([dimensions.boundedHeight, 0])

    // const freezingTemperaturePlacement = yScale(32)
    // Define a custom value for freezing using the Seattle weather dataset
    const freezingTemperaturePlacement = yScale(1)

    const freezingTemperatures = clip.append("rect")
        .attr("class", "freezing")
        .attr("x", 0)
        .attr("width", d3.max([0, dimensions.boundedWidth]))
        .attr("y", freezingTemperaturePlacement)
        .attr("height", d3.max([0, dimensions.boundedHeight - freezingTemperaturePlacement]))

    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, xAccessor))
        .range([0, dimensions.boundedWidth])

    // 5. Draw data

    const lineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(yAccessor(d)))

    const line = clip.append("path")
        .attr("class", "line")
        .attr("d", lineGenerator(dataset))

    const lineGenerator2 = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(y2Accessor(d)))

    const line2 = clip.append("path")
        .attr("class", "line")
        .style("stroke-dasharray", ("3, 3"))
        .attr("d", lineGenerator2(dataset))

    // 6. Draw peripherals

    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)

    const yAxis = bounds.append("g")
        .attr("class", "y-axis")
        .call(yAxisGenerator)

    const yAxisLabel = yAxis.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -dimensions.boundedHeight / 2)
        .attr("y", -dimensions.margin.left + 10)
        .html("Predicted Obesity Level")

    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)

    const xAxis = bounds.append("g")
        .attr("class", "x-axis")
        .style("transform", `translateY(${dimensions.boundedHeight}px)`)
        .call(xAxisGenerator)
    
    const xAxisLabel = xAxis.append("text")
        .attr("class", "x-axis-label")
        .attr("x", -dimensions.boundedHeight / 2)
        .attr("y", -dimensions.margin.left + 10)
        .html("Data record")

        

    // 7. Set up interactions

    // For a timeline, we want to display a tooltip whenever a hover occurs anywhere on the chart, so we need to create an element that spans our entire bounds
    const listeningRect = bounds.append("rect")
        // We don't need to define x or y attributes because they both default to 0 for rect elements
        .attr("class", "listening-rect")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)
        .on("mousemove", onMouseMove)
        .on("mouseleave", onMouseLeave)

    const tooltip = d3.select("#tooltip")

    // EXTRA CREDIT: Position a circle over the spot we're hovering over
    const tooltipCircle = bounds.append("circle") // Draw and then immediately hide it
        .attr("r", 4)
        .attr("stroke", "#af9358")
        .attr("fill", "white")
        .attr("stroke-width", 2)
        .style("opacity", 0)

    function onMouseMove() {
        // How will we know the location on our line that we are hovering over?
        const mousePosition = d3.mouse(this)  // this refers to listeningRect
        // We can use the .invert() method of xScale() to convert our units backward - from the range to the domain, instead of from the domain to the range (default)
        const hoveredDate = xScale.invert(mousePosition[0])

        // Find the distance between the hovered point and a datapoint - use the absolute value since we don't care if the point is before or after the hovered date
        const getDistanceFromHoveredDate = d => Math.abs(xAccessor(d) - hoveredDate)

        // Use .scan() to get the index of the closest data point to our hovered date
        const closestIndex = d3.scan(dataset, (a, b) => (getDistanceFromHoveredDate(a) - getDistanceFromHoveredDate(b)))
        const closestDataPoint = dataset[closestIndex]
        const closestXValue = xAccessor(closestDataPoint)
        const closestYValue = yAccessor(closestDataPoint)

        // Use the closestXValue to set the date in our t
        tooltip.select("#date").text(closestXValue)

        // Use the closestYValue to set the temperature in our tooltip
        const formatTemperature = d => `${d3.format(".1f")(d)}`
        tooltip.select("#temperature").text(formatTemperature(closestYValue))
        
        // Grab the x,y position of our closest point
        const x = xScale(closestXValue) + dimensions.margin.left
        const y = yScale(closestYValue) + dimensions.margin.top
        // Shift our tooltip
        tooltip.style("transform", `translate(calc(-50% + ${x}px), calc(-100% + ${y}px))`)
        // Position our tooltip circle and display it
        tooltipCircle
            .attr("cx", xScale(closestXValue))
            .attr("cy", yScale(closestYValue))
            .style("opacity", 1)
        
        // Display our tooltip
        tooltip.style("opacity", 1)
    }
    function onMouseLeave() {
        tooltip.style("opacity", 0) // Hide our tooltip
        tooltipCircle.style("opacity", 0) // Hide our tooltip circle
    }

}
drawLineChart()