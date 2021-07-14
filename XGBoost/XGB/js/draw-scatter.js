async function drawScatter() {
    const pathToJSON = "https://raw.githubusercontent.com/gajeto/XGBoost-Visualization/main/data/results.json"
    const dataset = await d3.json(pathToJSON)
    const xAccessor = d => d.Test
    const yAccessor = d => d.Predicted
    // Let's show how the amount of cloud cover varies based on humidity and dew point
    const colorAccessor = d => d.Error

    // Create chart dimensions
    // REMEMBER: For scatter plots, we typically want square charts so axes do not appear squished
    //           In this example, we want to use whatever is smaller - the width or height of our chart area.
    //
    // d3.min() offers a whole host of benefits/safeguards; which is why it is preferable when creating charts
    const width = d3.min([window.innerWidth * 0.9, window.innerHeight * 0.9])

    let dimensions = {
        width: width,
        height: width,
        margin: {
            top: 10,
            right: 10,
            bottom: 50,
            left: 50,
        },
    }
    dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    // Draw canvas
    const wrapper = d3.select("#wrapper")
        .append("svg")
        // Note that these width and height sizes are the size "outside" of our plot
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    const bounds = wrapper.append("g")
        // Create a group element to move the inner part of our chart to the right and down
        .style("transform", `translate(${dimensions.margin.left
            }px, ${dimensions.margin.top
            }px)`)

    // Create scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, xAccessor))  // Find the min and max values
        .range([0, dimensions.boundedWidth])    // Display values appropriately
        // Current scale would be [8.19, 58.38] - let's use .nice() to make a friendlier scale
        .nice()
    // Now our scale is [5, 60] - offering better readability and avoiding smushing dots to the edge

    const yScale = d3.scaleLinear()
        .domain(d3.extent(dataset, yAccessor))  // Find the min and max values
        .range([dimensions.boundedHeight, 0])   // Invert the range so the axis runs bottom-to-top
        // Current scale would be [0.27, 0.93] - let's use .nice() to make a friendlier scale
        .nice()
    // Now our scale is [0.25, 0.95] - offering better readability and avoiding smushing dots to the edge

    const colorScale = d3.scaleLinear()
        .domain(d3.extent(dataset, colorAccessor))  // Find the min and max values
        .range(["yellow", "red"])

   
    const drawDots = (dataset) => {
        const dots = bounds.selectAll("circle")
            .data(dataset)

        dots.join("circle")
            .attr("cx", d => xScale(xAccessor(d)))
            .attr("cy", d => yScale(yAccessor(d)))
            .attr("r", 4)
            .attr("fill", d => colorScale(colorAccessor(d)))  // Fill based on our new color scale for cloud cover
    }
    drawDots(dataset.slice(0, 200))

    setTimeout(() => {
        drawDots(dataset)
    }, 1000)
    
    const delaunay = d3.Delaunay.from(dataset, d => xScale(xAccessor(d)), d => yScale(yAccessor(d)))

    // Turn our delaunay triangulation into a voronoi diagram
    const voronoi = delaunay.voronoi()

    // Specify the size of our diagram
    voronoi.xmax = dimensions.boundedWidth
    voronoi.ymax = dimensions.boundedHeight

    // Bind our data and add a <path> for each data point with a class of voronoi for styling with our CSS file
    bounds.selectAll(".voronoi")
        .data(dataset)
        .enter().append("path")
        .attr("class", "voronoi")
        // Create each path's d attribute string using voronoi.renderCell(i)
        .attr("d", (d, i) => voronoi.renderCell(i))
        // Give our polygons a stroke so we can see them
        //.attr("stroke", "white")

    // x axis
    const xAxisGenerator = d3.axisBottom()
        .scale(xScale)
        .ticks(6)
    // Remember to translate the x axis to move it to the bottom of the chart bounds
    const xAxis = bounds.append("g")
        .call(xAxisGenerator)
        .style("transform", `translateY(${dimensions.boundedHeight}px)`)

    // Label for the x axis
    const xAxisLabel = xAxis.append("text") // Append a text element to our SVG
        .attr("x", dimensions.boundedWidth / 2) // Position it horizontally centered
        .attr("y", dimensions.margin.bottom - 10) // Position it slightly above the bottom of the chart
        // Explicitly set fill to black because D3 sets a fill of none by default on the axis "g" element
        .attr("fill", "black")
        // Style our label
        .style("font-size", "1.4em")
        // Add text to display on label
        .html("Target Obesity Level")

    // y axis
    const yAxisGenerator = d3.axisLeft()
        .scale(yScale)
        // Cut down on visual clutter and aim for a certain number (4) of ticks
        .ticks(6)
    // Note that the resulting axis won't necessarily have exactly 4 ticks. It will aim for four ticks, but also use friendly intervals to get close. You can also specify exact values of ticks with the .ticksValues() method

    const yAxis = bounds.append("g")
        .call(yAxisGenerator)

    // Label for the y axis
    const yAxisLabel = yAxis.append("text")
        // Draw this in the middle of the y axis and just inside the left side of the chart wrapper
        .attr("x", -dimensions.boundedHeight / 2)
        .attr("y", -dimensions.margin.left + 10)
        .attr("fill", "black")
        .style("font-size", "1.4em")
        .text("Predicted Obesity Level")
        // Rotate the label to find next to the y axis
        .style("transform", "rotate(-90deg)")
        // Rotate the label around its center
        .style("text-anchor", "middle")

    // Set up interactions
    bounds.selectAll(".voronoi")
        .on("mouseenter", onMouseEnter)
        .on("mouseleave", onMouseLeave)

    const tooltip = d3.select("#tooltip")
    function onMouseEnter(datum, index) {
        // Draw a dot to make sure our hovered dot is larger and on top of any neighboring dots
        const dayDot = bounds.append("circle")
            .attr("class", "tooltipDot")
            .attr("cx", d => xScale(xAccessor(datum)))
            .attr("cy", d => yScale(yAccessor(datum)))
            .attr("r", 7)
            .style("fill", d => colorScale(colorAccessor(datum)))
            .style("pointer-events", "none")

        // We want to display the metric on our x axis (dew point) and the metric on our y axis (humidity)
        const formatTest = d3.format(".2f")
        tooltip.select("#targeted").text(formatTest(xAccessor(datum)))

        const formatPredicted = d3.format(".2f")
        tooltip.select("#predicted").text(formatPredicted(yAccessor(datum)))

        // Plug the new date string into our tooltip
        const formatDate= d3.format(".2f")
        tooltip.select("#error").text(formatDate(colorAccessor(datum)))
       
       
        // Grab the x and y value of our dot; offset by the left and top margins
        const x = xScale(xAccessor(datum)) + dimensions.margin.left
        const y = yScale(yAccessor(datum)) + dimensions.margin.top

        // Use calc() to add these values to percentage offsets needed to shift the tooltip - we're positioning its arrow, not the top left corner
        tooltip.style("transform", `translate(calc(-50% + ${x}px), calc(-100% + ${y}px))`)

        // Make our tooltip visible
        tooltip.style("opacity", 1)

    }
    function onMouseLeave(datum, index) {
        tooltip.style("opacity", 0) // Hide our tooltip
        d3.selectAll(".tooltipDot").remove()  // Remove the dot drawn by the tooltip hover
    }
}

drawScatter()
