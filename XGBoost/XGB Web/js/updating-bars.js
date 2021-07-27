async function updatingBars() {
    // 1. Access data
    const dataset = await d3.json('https://raw.githubusercontent.com/gajeto/XGBoost-Visualization/main/data/results.json')

    // 2. Create chart dimensions

    const width = 700
    let dimensions = {
        width: width,
        height: width * 0.6,
        margin: {
            top: 30,
            right: 10,
            bottom: 50,
            left: 50,
        },
    }
    dimensions.boundedWidth =
        dimensions.width - dimensions.margin.left - dimensions.margin.right
    dimensions.boundedHeight =
        dimensions.height - dimensions.margin.top - dimensions.margin.bottom

    // 3. Draw canvas

    const wrapper = d3
        .select('#wrapper')
        .append('svg')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)

    const bounds = wrapper
        .append('g')
        .style(
            'transform',
            `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
        )

    // init static elements
    bounds.append('g').attr('class', 'bins')
    bounds.append('line').attr('class', 'mean')
    bounds
        .append('g')
        .attr('class', 'x-axis')
        .style('transform', `translateY(${dimensions.boundedHeight}px)`)
        .append('text')
        .attr('class', 'x-axis-label')

    const drawHistogram = metric => {
        const metricAccessor = d => d[metric]
        const yAccessor = d => d.length

        // 4. Create scales

        const xScale = d3
            .scaleLinear()
            .domain(d3.extent(dataset, metricAccessor))
            .range([0, dimensions.boundedWidth])
            .nice()

        const binsGenerator = d3
            .histogram()
            .domain(xScale.domain())
            .value(metricAccessor)
            .thresholds(12)

        const bins = binsGenerator(dataset)

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(bins, yAccessor)])
            .range([dimensions.boundedHeight, 0])
            .nice()

        // 5. Draw data

        const barPadding = 1

        let binGroups = bounds
            .select('.bins')
            .selectAll('.bin')
            .data(bins)

        binGroups.exit().remove()

        const newBinGroups = binGroups
            .enter()
            .append('g')
            .attr('class', 'bin')

        newBinGroups.append('rect')
        newBinGroups.append('text')

        // update binGroups to include new points
        binGroups = newBinGroups.merge(binGroups)

        const barRects = binGroups
            .select('rect')
            .attr('x', d => xScale(d.x0) + barPadding)
            .attr('y', d => yScale(yAccessor(d)))
            .attr('width', d => d3.max([0, xScale(d.x1) - xScale(d.x0) - barPadding]))
            .attr('height', d => dimensions.boundedHeight - yScale(yAccessor(d)))

        const barText = binGroups
            .select('text')
            .attr('x', d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
            .attr("y", 0)
            .style("transform", d => `translateY(${yScale(yAccessor(d)) - 5
                }px)`)
            // Fill text elements with empty strings to prevent labeling empty bars
            .text(d => yAccessor(d) || "")

        const mean = d3.mean(dataset, metricAccessor)

        // ORIGINAL: meanLine instantly changes position
        // const meanLine = bounds
        //     .selectAll('.mean')
        //     .attr('x1', xScale(mean))
        //     .attr('x2', xScale(mean))
        //     .attr('y1', -20)
        //     .attr('y2', dimensions.boundedHeight)

        // IMPROVEMENT: Animate our meanLine when it moves left and right. Since we can't apply a transition to x1 and x2 (they are SVG attributes), we can position the line's horizontal position instead
        const meanLine = bounds.selectAll('.mean')
            .attr("y1", -20)
            .attr("y2", dimensions.boundedHeight)
            .style("transform", `translateX(${xScale(mean)}px)`)
        

        // 6. Draw peripherals

        const xAxisGenerator = d3.axisBottom().scale(xScale)

        const xAxis = bounds.select('.x-axis').call(xAxisGenerator)

        const xAxisLabel = xAxis
            .select('.x-axis-label')
            .attr('x', dimensions.boundedWidth / 2)
            .attr('y', dimensions.margin.bottom - 10)
            .text(metric)
        

        binGroups
            .select('rect')
            .on('mouseenter', onMouseEnter)
            .on('mouseleave', onMouseLeave)

        const tooltip = d3.select("#tooltip")
        function onMouseEnter(datum) {
            const formatFeature = d3.format(".2f") // 0.6000000000000001 => 0.60

            // Update #range to display the values of the bar
            tooltip.select("#range")
                // .text([datum.x0, datum.x1].join(" - ")) // 0.55 - 0.6000000000000001
                .text(metric + ':'+[formatFeature(datum.x0), formatFeature(datum.x1)].join(" - ")) // 0.60

            
            // Update #count to display the y value of the bar
            tooltip.select("#count").text(yAccessor(datum))
            // Calculate the x position of our tooltip
            const xPositionOfBarInChart = xScale(datum.x0)
            const widthOfBarInChart = xScale(datum.x1) - xScale(datum.x0)
            const boundsMarginOfShiftToRight = dimensions.margin.left
            const x = xPositionOfBarInChart + (widthOfBarInChart / 2) + boundsMarginOfShiftToRight

            // Calculate the y position of our tooltip
            const yPositionOfBarInChart = yScale(yAccessor(datum))
            const boundsMarginOfShiftDown = dimensions.margin.top
            const y = yPositionOfBarInChart + boundsMarginOfShiftDown


            tooltip.style("transform", `translate(calc(5% + ${x}px), calc(10% + ${y}px))`)

            // Now that we have styled our tooltip, it's time to display it to the user
            tooltip.style("opacity", 1)
        }

        function onMouseLeave(datum) {
            tooltip.style("opacity", 0) // Hide our tooltip
        }

    }

    const metrics = [
        'Error',
        'Predicted',
        'Test',
    ]

    let selectedMetricIndex = 0
    drawHistogram(metrics[selectedMetricIndex])

    const button = d3
        .select('body')
        .append('button')
        .text('Change metric')

    button.node().addEventListener('click', onClick)

    function onClick() {
        selectedMetricIndex = (selectedMetricIndex + 1) % metrics.length
        drawHistogram(metrics[selectedMetricIndex])
    }
}
updatingBars()