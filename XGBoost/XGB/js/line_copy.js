var date1 = [{
    'date': '20111001',
    'New York': '63.4',
    'San Francisco': '62.7',
    'Austin': '72.2'
}, {
    'date': '20111002',
    'New York': '58',
    'San Francisco': '59.9',
    'Austin': '67.7'
}, {
    'date': '20111003',
    'New York': '53.3',
    'San Francisco': '59.1',
    'Austin': '69.4'
}, {
    'date': '20111004',
    'New York': '35.7',
    'San Francisco': '58.8',
    'Austin': '68'
}, {
    'date': '20111005',
    'New York': '34.2',
    'San Francisco': '58.7',
    'Austin': '72.4'
},];

var date2 = [{
    'date': '20111003',
    'New York': '33.3',
    'San Francisco': '49.1',
    'Austin': '59.4',
    'Test': '86.5'

}, {
    'date': '20111004',
    'New York': '45.7',
    'San Francisco': '48.8',
    'Austin': '58',
    'Test': '56.5'

},];

var margin = {
    top: 10,
    right: 15,
    bottom: 100,
    left: 40
}, margin2 = {
    top: 430,
    right: 10,
    bottom: 20,
    left: 40
}, width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    height2 = 500 - margin2.top - margin2.bottom;

var parseDate = d3.time.format("%Y%m%d").parse;

var x = d3.time.scale().range([0, width]),
    x2 = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left"),
    yAxis2 = d3.svg.axis().scale(y2).orient("left").ticks(2);

var color = d3.scale.category10();

var brush = d3.svg.brush().x(x2).on("brush", brush);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var line = d3.svg.line().x(function (d) {
    return x(d.date);
})
    .y(function (d) {
        return y(d.probability);
    });

var line2 = d3.svg.line().x(function (d) {
    return x2(d.date);
})
    .y(function (d) {
        return y2(d.probability);
    });

var svg = d3.select("body").append("svg").attr("width",
    width + margin.left + margin.right).attr("height",
        height + margin.top + margin.bottom);

svg.append("defs").append("clipPath").attr("id", "clip").append("rect")
    .attr("width", width).attr("height", height);

var div = d3.select("body").append("div").attr("class", "tooltip")
    .style("opacity", 0);

var focus = svg.append("g").attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g").attr("transform",
    "translate(" + margin2.left + "," + margin2.top + ")");


context.append("g").attr("class", "x brush").call(brush).selectAll(
    "rect").attr("y", -6).attr("height", height2 + 7);

focus.append("g").attr("class", "x axis").attr("transform",
    "translate(0," + height + ")").call(xAxis);

focus.append("g").attr("class", "y axis").call(yAxis);

context.append("g").attr("class", "x axis").attr("transform",
    "translate(0," + height2 + ")").call(xAxis2);

context.append("g").attr("class", "y axis").call(yAxis2);



svg.append("g")
    .attr("class", "y axis")
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("probability (ºF)");

update(date1);

// draw and redraw, calculate axes/domains, etc here
function update(date) {

    date.forEach(function (d) {
        d.date = parseDate(d.date);
    });

    color.domain(d3.keys(date[0]).filter(function (key) {
        return key !== "date";
    }));

    var topics = color.domain().map(function (name) {
        return {
            name: name,
            values: date.map(function (d) {
                return {
                    date: d.date,
                    probability: +d[name]
                };
            })
        };
    });

    console.log(topics);

    x.domain(d3.extent(date, function (d) {
        return d.date;
    }));

    y.domain([d3.min(topics, function (c) {
        return d3.min(c.values, function (v) {
            return v.probability;
        });
    }) - .01,
    d3.max(topics, function (c) {
        return d3.max(c.values, function (v) {
            return v.probability;
        });
    })]);

    x2.domain(x.domain());
    y2.domain(y.domain());


    // update axes
    d3.transition(svg).select('.y.axis')
        .call(yAxis);

    d3.transition(svg).select('.x.axis')
        .call(xAxis);

    var smallTopic = context.selectAll(".topic").data(topics);

    var topic = focus.selectAll(".topic").data(topics);

    var smallTopicEnter = smallTopic.enter().append("g").attr("class", "topic");

    var topicEnter = topic.enter().append("g").attr("class", "topic");

    smallTopicEnter.append("path").attr("class", line2)
        .attr("d", function (d) {
            return line2(d.values);
        })
        .style("stroke", function (d) {
            return color(d.name);
        });

    topicEnter.append("path").attr("class", line)
        .attr("clip-path", "url(#clip)")
        .attr("d", function (d) {
            return line(d.values);
        })
        .style("stroke", function (d) {
            return color(d.name);
        });


    //*************ERROR MUST BE HERE********************
    //*************ERROR MUST BE HERE********************
    //*************ERROR MUST BE HERE********************

    topicEnter.append("g").selectAll(".dot")
        .data(function (d) {
            return d.values
        }).enter().append("circle").attr("clip-path", "url(#clip)")
        .attr("stroke", function (d) {
            return color(this.parentNode.__data__.name)
        })
        .attr("cx", function (d) {
            return x(d.date);
        })
        .attr("cy", function (d) {
            return y(d.probability);
        })
        .attr("r", 5)
        .attr("fill", "white").attr("fill-opacity", .5)
        .attr("stroke-width", 2).on("mouseover", function (d) {
            div.transition().duration(100).style("opacity", .9);
            div.html(this.parentNode.__data__.name + "<br/>" + d.probability).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px").attr('r', 8);
            d3.select(this).attr('r', 8)
        }).on("mouseout", function (d) {
            div.transition().duration(100).style("opacity", 0)
            d3.select(this).attr('r', 5);
        });

    // transition by selecting 'topic'...
    topicUpdate = d3.transition(topic);
    smallTopicUpdate = d3.transition(smallTopic);

    // ... and each path within
    topicUpdate.select('path')
        .transition().duration(600)
        .attr("d", function (d) {
            return line(d.values);
        });

    topicEnter.append("g").selectAll(".dot").transition().duration(600)
        .data(function (d) {
            return d.values
        }).enter().append("circle").attr("clip-path", "url(#clip)")
        .attr("stroke", function (d) {
            return color(this.parentNode.__data__.name)
        })
        .attr("cx", function (d) {
            return x(d.date);
        })
        .attr("cy", function (d) {
            return y(d.probability);
        })
        .attr("r", 5)
        .attr("fill", "white").attr("fill-opacity", .5)
        .attr("stroke-width", 2).on("mouseover", function (d) {
            div.transition().duration(100).style("opacity", .9);
            div.html(this.parentNode.__data__.name + "<br/>" + d.probability).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px").attr('r', 8);
            d3.select(this).attr('r', 8)
        }).on("mouseout", function (d) {
            div.transition().duration(100).style("opacity", 0)
            d3.select(this).attr('r', 5);
        });

    smallTopicUpdate.select('path')
        .transition().duration(600)
        .attr("d", function (d) {
            return line2(d.values);
        });

    topic.exit().remove();
    smallTopic.exit().remove();

}

function brush() {
    x.domain(brush.empty() ? x2.domain() : brush.extent());
    focus.selectAll("path").attr("d", function (d) {
        return d ? line(d.values) : ''
    })
    focus.select(".x.axis").call(xAxis);
    focus.select(".y.axis").call(yAxis);
    focus.selectAll("circle").attr("cx", function (dd) {
        return x(dd.date);
    }).attr("cy", function (dd) {
        return y(dd.probability);
    });
}